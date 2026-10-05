import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrediction, outputUrl, ReplicateError } from "@/lib/replicate";
import { readJsonBody } from "@/lib/readJson";

export const runtime = "nodejs";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const schema = z.object({
  predictionId: z.string().min(1).max(100),
  type: z.enum(["image", "video"]),
  prompt: z.string().max(5_000).optional(),
  aspectRatio: z.string().max(20).optional(),
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

  const { predictionId, prompt, aspectRatio } = parsed.data;

  const admin = createAdminClient();

  // The prediction must belong to the requester (tracked at submission time).
  const { data: job } = await admin
    .from("media_jobs")
    .select("user_id, type, prompt, aspect_ratio")
    .eq("prediction_id", predictionId)
    .maybeSingle();
  if (!job || job.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Account must still be active with Creative Studio access.
  const { data: profile } = await admin
    .from("profiles")
    .select("status, feature_media")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status !== "active")
    return NextResponse.json({ error: "Account not active." }, { status: 403 });
  if (!profile.feature_media)
    return NextResponse.json(
      { error: "Creative Studio is an upgrade. Please unlock it." },
      { status: 402 }
    );

  const mediaType = job.type as "image" | "video";

  let prediction;
  try {
    prediction = await getPrediction(predictionId);
  } catch (err) {
    const status = err instanceof ReplicateError ? err.status : 500;
    const message =
      err instanceof ReplicateError ? err.message : "Could not fetch the prediction.";
    return NextResponse.json({ error: message }, { status });
  }

  const src = outputUrl(prediction.output);
  if (prediction.status !== "succeeded" || !src)
    return NextResponse.json({ error: "Not ready" }, { status: 400 });

  const upstream = await fetch(src);
  if (!upstream.ok)
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  const contentType =
    upstream.headers.get("content-type") ||
    (mediaType === "video" ? "video/mp4" : "image/png");
  const ext = EXT[contentType.toLowerCase()] || (mediaType === "video" ? "mp4" : "png");
  const bytes = new Uint8Array(await upstream.arrayBuffer());

  const path = `${user.id}/${predictionId}.${ext}`;

  const { error: upErr } = await admin.storage
    .from("media")
    .upload(path, bytes, { contentType, upsert: true });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  // One row per (user, prediction): re-saving updates instead of duplicating.
  const { data: row, error: insErr } = await admin
    .from("generations")
    .upsert(
      {
        user_id: user.id,
        prediction_id: predictionId,
        type: mediaType,
        prompt: prompt ?? job.prompt ?? null,
        aspect_ratio: aspectRatio ?? job.aspect_ratio ?? null,
        storage_path: path,
        content_type: contentType,
      },
      { onConflict: "user_id,prediction_id" }
    )
    .select("id")
    .single();
  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ genId: row.id });
}
