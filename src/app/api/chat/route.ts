import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  preCheckCredits,
  reserveWords,
  settleWords,
  creditError,
} from "@/lib/credits";
import { chargedStream } from "@/lib/chargedStream";
import { readJsonBody } from "@/lib/readJson";
import { isModelActive, resolveModel, getVisionModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

// Upper bound of one streamed answer; also the up-front reservation.
const MAX_OUTPUT_WORDS = 4096;
const MAX_MESSAGE_CHARS = 20_000;

const bodySchema = z.object({
  model: z.string().min(1).max(100),
  templateId: z.string().uuid().optional(),
  image: z.string().optional(), // data URL for vision (Pro)
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_MESSAGE_CHARS),
      })
    )
    .min(1)
    .max(50),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Larger cap than other routes: vision images travel as data URLs.
  const parsed = bodySchema.safeParse(await readJsonBody(req, 8_000_000));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { model, templateId, image, messages } = parsed.data;

  // Reject oversized image payloads (~5MB binary ≈ 7M base64 chars).
  if (image && image.length > 7_000_000) {
    return NextResponse.json(
      { error: "Image too large. Please use an image under 5MB." },
      { status: 413 }
    );
  }

  const [check, identity] = await Promise.all([
    preCheckCredits(user.id),
    getIdentityPrompt(),
  ]);
  if (!check.ok) {
    const { status, error } = creditError(check.reason);
    return NextResponse.json({ error }, { status });
  }

  if (!(await isModelActive(model))) {
    return NextResponse.json({ error: "Model not available" }, { status: 400 });
  }

  let realModel = await resolveModel(model);

  // Personas are resolved server-side from the template id; the client never
  // sends raw system prompts. RLS only exposes templates the user's tier unlocks.
  let persona: string | null = null;
  if (templateId) {
    const { data } = await supabase
      .from("templates")
      .select("system_prompt")
      .eq("id", templateId)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) {
      return NextResponse.json({ error: "Template not available" }, { status: 400 });
    }
    persona = data.system_prompt;
  }

  const chatMessages: ChatMessage[] = [{ role: "system", content: identity }];
  if (persona) chatMessages.push({ role: "system", content: persona });
  chatMessages.push(...(messages as ChatMessage[]));

  // Vision (Pro): attach image to the last user message and use a vision model.
  if (image) {
    if (!check.profile?.feature_pro) {
      return NextResponse.json(
        { error: "Image analysis is a Pro upgrade. Please upgrade to unlock." },
        { status: 402 }
      );
    }
    const visionModel = getVisionModel();
    if (!visionModel) {
      return NextResponse.json(
        { error: "Vision is not configured on this server." },
        { status: 400 }
      );
    }
    realModel = visionModel;
    const lastIdx = chatMessages.length - 1;
    const last = chatMessages[lastIdx];
    const text = typeof last.content === "string" ? last.content : "";
    chatMessages[lastIdx] = {
      role: "user",
      content: [
        { type: "text", text: text || "Describe this image." },
        { type: "image_url", image_url: { url: image } },
      ],
    };
  }

  // Reserve up front so parallel requests can't spend the same words.
  const reservation = await reserveWords({
    userId: user.id,
    amount: MAX_OUTPUT_WORDS,
    unlimited: check.profile?.is_unlimited,
  });
  if (!reservation.ok) {
    const { status, error } = creditError("empty");
    return NextResponse.json({ error }, { status });
  }

  try {
    const { stream, getFullText } = await streamChat({
      model: realModel,
      messages: chatMessages,
      maxTokens: MAX_OUTPUT_WORDS,
      signal: req.signal,
    });

    const charged = chargedStream({
      stream,
      getFullText,
      userId: user.id,
      module: "chat",
      model,
      unlimited: check.profile?.is_unlimited,
      reserved: reservation.reserved,
    });

    return new Response(charged, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    // Provider call failed before streaming — release the reservation.
    await settleWords({
      userId: user.id,
      reserved: reservation.reserved,
      outputText: "",
      module: "chat",
      model,
      unlimited: check.profile?.is_unlimited,
    });
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status });
  }
}
