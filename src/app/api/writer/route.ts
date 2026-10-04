import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preCheckCredits, chargeWords, creditError } from "@/lib/credits";
import { getBackendModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { completeChat, KimiError } from "@/lib/kimi/client";

export const runtime = "nodejs";

const schema = z.object({
  topic: z.string().min(1),
  tone: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
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

  const { topic, tone = "professional", length = "medium" } = parsed.data;
  const lengthHint = { short: "around 150 words", medium: "around 400 words", long: "around 800 words" }[length];

  const model = await getBackendModel();
  const identity = await getIdentityPrompt();
  try {
    const output = await completeChat({
      model,
      messages: [
        { role: "system", content: identity },
        {
          role: "system",
          content:
            "You are an expert content writer. Produce clean, well-structured, ready-to-publish content.",
        },
        {
          role: "user",
          content: `Write content about: ${topic}\nTone: ${tone}\nLength: ${lengthHint}.`,
        },
      ],
    });

    const { remaining } = await chargeWords({
      userId: user.id,
      outputText: output,
      module: "writer",
      model,
      unlimited: check.profile?.is_unlimited,
    });

    return NextResponse.json({ output, remaining });
  } catch (err) {
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status });
  }
}
