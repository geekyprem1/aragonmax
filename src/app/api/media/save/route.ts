import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrediction, outputUrl } from "@/lib/replicate";

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
  predictionId: z.string().min(1),
  type: z.enum(["image", "video"]),
  prompt: z.string().optional(),
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

  const { predictionId, type, prompt, aspectRatio } = parsed.data;

  const prediction = await getPrediction(predictionId);
  const src = outputUrl(prediction.output);
  if (prediction.status !== "succeeded" || !src)
    return NextResponse.json({ error: "Not ready" }, { status: 400 });

  const upstream = await fetch(src);
  if (!upstream.ok)
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  const contentType =
    upstream.headers.get("content-type") ||
    (type === "video" ? "video/mp4" : "image/png");
  const ext = EXT[contentType.toLowerCase()] || (type === "video" ? "mp4" : "png");
  const bytes = new Uint8Array(await upstream.arrayBuffer());

  const admin = createAdminClient();
  const path = `${user.id}/${predictionId}.${ext}`;

  const { error: upErr } = await admin.storage
    .from("media")
    .upload(path, bytes, { contentType, upsert: true });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: row, error: insErr } = await admin
    .from("generations")
    .insert({
      user_id: user.id,
      type,
      prompt: prompt ?? null,
      aspect_ratio: aspectRatio ?? null,
      storage_path: path,
      content_type: contentType,
    })
    .select("id")
    .single();
  if (insErr)
    return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ genId: row.id });
}
