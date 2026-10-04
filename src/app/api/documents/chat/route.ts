import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preCheckCredits, chargeWords, creditError } from "@/lib/credits";
import { getBackendModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

const MAX_CONTEXT_CHARS = 40000;

const schema = z.object({
  question: z.string().min(1),
  context: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

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
  const doc = context.slice(0, MAX_CONTEXT_CHARS);

  const messages: ChatMessage[] = [
    { role: "system", content: identity },
    {
      role: "system",
      content:
        "You answer questions using ONLY the document provided below. If the answer is not in the document, say you could not find it in the document. Be concise and cite relevant parts.\n\n=== DOCUMENT START ===\n" +
        doc +
        "\n=== DOCUMENT END ===",
    },
    ...((history ?? []) as ChatMessage[]),
    { role: "user", content: question },
  ];

  try {
    const { stream, getFullText } = await streamChat({ model, messages });
    const reader = stream.getReader();
    const unlimited = !!check.profile?.is_unlimited;
    const charged = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          const output = getFullText();
          if (output)
            await chargeWords({
              userId: user.id,
              outputText: output,
              module: "chat",
              model,
              unlimited,
            });
          return;
        }
        controller.enqueue(value);
      },
    });
    return new Response(charged, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (err) {
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status });
  }
}
