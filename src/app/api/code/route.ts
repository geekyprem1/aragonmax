import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preCheckCredits, chargeWords, creditError } from "@/lib/credits";
import { getBackendModel, isModelActive, resolveModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { streamChat, KimiError, type ChatMessage } from "@/lib/kimi/client";

export const runtime = "nodejs";

const schema = z.object({
  prompt: z.string().min(1),
  language: z.string().optional(),
  model: z.string().optional(),
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

  try {
    const { stream, getFullText } = await streamChat({ model, messages, reasoning: "on" });
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
              module: "code",
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
