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
import { getBackendModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

// Documents beyond this are rejected (instead of silently truncated).
const MAX_CONTEXT_CHARS = 40000;
const MAX_OUTPUT_WORDS = 2048;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_CHARS = 20_000;

const schema = z.object({
  question: z.string().min(1).max(20_000),
  context: z
    .string()
    .min(1)
    .max(
      MAX_CONTEXT_CHARS,
      `Document is too long. Please use a document under ${MAX_CONTEXT_CHARS.toLocaleString()} characters (split it into smaller files).`
    ),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_HISTORY_CHARS),
      })
    )
    .max(MAX_HISTORY_ITEMS)
    .optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const check = await preCheckCredits(user.id);
  if (!check.ok) {
    const { status, error } = creditError(check.reason);
    return NextResponse.json({ error }, { status });
  }

  if (!check.profile?.feature_pro) {
    return NextResponse.json(
      { error: "Chat with Documents is a Pro upgrade. Please upgrade to unlock." },
      { status: 402 }
    );
  }

  const { question, context, history } = parsed.data;
  const model = await getBackendModel();
  const identity = await getIdentityPrompt();

  const messages: ChatMessage[] = [
    { role: "system", content: identity },
    {
      role: "system",
      content:
        "You answer questions using ONLY the document provided below. If the answer is not in the document, say you could not find it in the document. Be concise and cite relevant parts.\n\n=== DOCUMENT START ===\n" +
        context +
        "\n=== DOCUMENT END ===",
    },
    ...((history ?? []) as ChatMessage[]),
    { role: "user", content: question },
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
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
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
