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
import { getBackendModel, isModelActive, resolveModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

// Upper bound of one streamed answer; also the up-front reservation.
// Reasoning tokens count towards this budget too.
const MAX_OUTPUT_WORDS = 8192;

const schema = z.object({
  prompt: z.string().min(1).max(20_000),
  language: z.string().max(50).optional(),
  model: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const check = await preCheckCredits(user.id);
  if (!check.ok) {
    const { status, error } = creditError(check.reason);
    return NextResponse.json({ error }, { status });
  }

  const { prompt, language, model: modelKey } = parsed.data;
  const model =
    modelKey && (await isModelActive(modelKey))
      ? await resolveModel(modelKey)
      : await getBackendModel();
  const identity = await getIdentityPrompt();

  const messages: ChatMessage[] = [
    { role: "system", content: identity },
    {
      role: "system",
      content:
        "You are an expert software engineer. Return clean, working, well-commented code. Always wrap code in fenced markdown code blocks with the correct language tag, and add a brief explanation.",
    },
    {
      role: "user",
      content: language ? `Language: ${language}\nTask: ${prompt}` : `Task: ${prompt}`,
    },
  ];

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
      model,
      messages,
      reasoning: "on",
      maxTokens: MAX_OUTPUT_WORDS,
      signal: req.signal,
    });

    const charged = chargedStream({
      stream,
      getFullText,
      userId: user.id,
      module: "code",
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
    await settleWords({
      userId: user.id,
      reserved: reservation.reserved,
      outputText: "",
      module: "code",
      model,
      unlimited: check.profile?.is_unlimited,
    });
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status });
  }
}
