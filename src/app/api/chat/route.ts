import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preCheckCredits, chargeWords, creditError } from "@/lib/credits";
import { isModelActive, resolveModel, getVisionModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

const bodySchema = z.object({
  model: z.string().min(1),
  systemPrompt: z.string().optional(),
  image: z.string().optional(), // data URL for vision (Pro)
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { model, systemPrompt, image, messages } = parsed.data;

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
  const chatMessages: ChatMessage[] = [{ role: "system", content: identity }];
  if (systemPrompt) chatMessages.push({ role: "system", content: systemPrompt });
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

  try {
    const { stream, getFullText } = await streamChat({
      model: realModel,
      messages: chatMessages,
      maxTokens: 4096,
    });

    // Wrap the stream so we can charge credits once it finishes.
    const reader = stream.getReader();
    const charged = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          const output = getFullText();
          if (output) {
            await chargeWords({
              userId: user.id,
              outputText: output,
              module: "chat",
              model,
              unlimited: check.profile?.is_unlimited,
            });
          }
          return;
        }
        controller.enqueue(value);
      },
    });

    return new Response(charged, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status });
  }
}
