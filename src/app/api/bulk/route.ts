import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  preCheckCredits,
  reserveWords,
  settleWords,
  creditError,
} from "@/lib/credits";
import { readJsonBody } from "@/lib/readJson";
import { getBackendModel } from "@/lib/kimi/models";
import { getIdentityPrompt } from "@/lib/identity";
import { completeChat, KimiError } from "@/lib/kimi/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS = 20;
const MAX_OUTPUT_WORDS = 1024;

const schema = z.object({
  instruction: z.string().min(1).max(20_000),
  items: z.array(z.string().min(1).max(2_000)).min(1).max(MAX_ITEMS),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request (max 20 items)" }, { status: 400 });

  const check = await preCheckCredits(user.id);
  if (!check.ok) {
    const { status, error } = creditError(check.reason);
    return NextResponse.json({ error }, { status });
  }

  // Feature gate.
  if (!check.profile?.feature_bulk) {
    return NextResponse.json(
      { error: "Bulk generation is a Pro upgrade. Please upgrade to unlock." },
      { status: 402 }
    );
  }

  const unlimited = !!check.profile?.is_unlimited;
  const { instruction, items } = parsed.data;
  const model = await getBackendModel();
  const identity = await getIdentityPrompt();

  const results: { item: string; output: string }[] = [];

  try {
    for (const item of items) {
      // split/join keeps user text literal (no $& replacement patterns).
      const prompt = instruction.includes("{item}")
        ? instruction.split("{item}").join(item)
        : `${instruction}\n\nItem: ${item}`;

      const reservation = await reserveWords({
        userId: user.id,
        amount: MAX_OUTPUT_WORDS,
        unlimited,
      });
      if (!reservation.ok) break; // out of words mid-run

      let output: string;
      try {
        output = await completeChat({
          model,
          messages: [
            { role: "system", content: identity },
            {
              role: "system",
              content:
                "You are an expert content generator. Produce clean, ready-to-use output for each item.",
            },
            { role: "user", content: prompt },
          ],
          maxTokens: MAX_OUTPUT_WORDS,
          signal: req.signal,
        });
      } catch (err) {
        // Release this item's reservation before failing the run.
        await settleWords({
          userId: user.id,
          reserved: reservation.reserved,
          outputText: "",
          module: "writer",
          model,
          unlimited,
        });
        throw err;
      }

      const { remaining } = await settleWords({
        userId: user.id,
        reserved: reservation.reserved,
        outputText: output,
        module: "writer",
        model,
        unlimited,
      });

      results.push({ item, output });

      // Stop early if a limited plan ran out.
      if (!unlimited && remaining !== null && remaining <= 0) break;
    }

    return NextResponse.json({ results });
  } catch (err) {
    const status = err instanceof KimiError ? err.status : 500;
    const message = err instanceof KimiError ? err.message : "Something went wrong";
    // Return whatever completed so far along with the error.
    return NextResponse.json({ error: message, results }, { status });
  }
}
