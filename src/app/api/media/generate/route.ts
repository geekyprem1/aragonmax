import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { preCheckMedia, chargeMediaCredit } from "@/lib/credits";
import {
  createPrediction,
  IMAGE_MODEL,
  VIDEO_MODEL,
  ReplicateError,
} from "@/lib/replicate";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["image", "video"]),
  prompt: z.string().min(1),
  aspectRatio: z.string().optional(),
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

  const { type, prompt, aspectRatio } = parsed.data;

  const check = await preCheckMedia(user.id, type);
  if (!check.ok) {
    if (check.reason === "no_access")
      return NextResponse.json(
        { error: "Creative Studio is an upgrade. Please unlock it." },
        { status: 402 }
      );
    if (check.reason === "empty")
      return NextResponse.json(
        { error: `You are out of ${type} credits.` },
        { status: 402 }
      );
    return NextResponse.json({ error: "Account not active." }, { status: 403 });
  }

  const input: Record<string, unknown> =
    type === "image"
      ? {
          prompt,
          aspect_ratio: aspectRatio || "1:1",
          quality: "low",
        }
      : {
          prompt,
          duration: 10,
          resolution: "720p",
          aspect_ratio: aspectRatio || "16:9",
          fps: 24,
        };

  try {
    const prediction = await createPrediction(
      type === "image" ? IMAGE_MODEL() : VIDEO_MODEL(),
      input
    );
    // Reserve one credit on successful submission.
    const remaining = await chargeMediaCredit(user.id, type);
    return NextResponse.json({ id: prediction.id, status: prediction.status, remaining });
  } catch (err) {
    const status = err instanceof ReplicateError ? err.status : 500;
    const message =
      err instanceof ReplicateError ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status });
  }
}
