import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  preCheckMedia,
  reserveMediaCredit,
  refundMediaCredit,
} from "@/lib/credits";
import { readJsonBody } from "@/lib/readJson";
import {
  createPrediction,
  IMAGE_MODEL,
  VIDEO_MODEL,
  ReplicateError,
} from "@/lib/replicate";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["image", "video"]),
  prompt: z.string().min(1).max(5_000),
  aspectRatio: z.string().min(1).max(20).optional(),
});

// Must match what each model actually accepts.
const RATIOS: Record<"image" | "video", string[]> = {
  image: ["1:1", "3:2", "2:3"],
  video: ["16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "1:1"],
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await readJsonBody(req));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { type, prompt, aspectRatio } = parsed.data;

  if (aspectRatio && !RATIOS[type].includes(aspectRatio)) {
    return NextResponse.json(
      {
        error: `Unsupported aspect ratio for ${type}. Supported: ${RATIOS[type].join(", ")}.`,
      },
      { status: 400 }
    );
  }

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

  // Reserve the credit BEFORE submitting the paid provider job, so parallel
  // requests can't spend the same credit. Refunded if submission fails.
  const reservation = await reserveMediaCredit(user.id, type);
  if (!reservation.ok) {
    return NextResponse.json(
      { error: `You are out of ${type} credits.` },
      { status: 402 }
    );
  }

  const admin = createAdminClient();

  try {
    const prediction = await createPrediction(
      type === "image" ? IMAGE_MODEL() : VIDEO_MODEL(),
      input
    );

    // Track ownership + prompt so status/save can verify the requester and
    // page reloads can resume pending jobs.
    const { error: jobErr } = await admin.from("media_jobs").insert({
      prediction_id: prediction.id,
      user_id: user.id,
      type,
      prompt,
      aspect_ratio: aspectRatio || (type === "image" ? "1:1" : "16:9"),
      status: prediction.status,
    });
    if (jobErr) {
      console.error("media_jobs insert failed:", jobErr.message);
      await refundMediaCredit(user.id, type);
      return NextResponse.json(
        { error: "Could not start the job. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      remaining: reservation.remaining,
    });
  } catch (err) {
    await refundMediaCredit(user.id, type);
    const status = err instanceof ReplicateError ? err.status : 500;
    const message =
      err instanceof ReplicateError ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status });
  }
}
