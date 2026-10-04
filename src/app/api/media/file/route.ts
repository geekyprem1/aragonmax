import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * Streams a user's saved media through our own domain (provider URL never
 * exposed). Owner-scoped via the generations table. ?dl=1 forces download.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gen = searchParams.get("gen");
  const dl = searchParams.get("dl") === "1";
  if (!gen) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("generations")
    .select("user_id, storage_path, content_type")
    .eq("id", gen)
    .maybeSingle();
  // Owner check — a user can only access their own generations.
  if (!row || row.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: file, error } = await admin.storage
    .from("media")
    .download(row.storage_path);
  if (error || !file)
    return NextResponse.json({ error: "File missing" }, { status: 404 });

  const contentType = row.content_type || "application/octet-stream";
  const ext = EXT[contentType.toLowerCase()] || "bin";
  return new Response(file.stream(), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": `${dl ? "attachment" : "inline"}; filename="argonmax-${gen}.${ext}"`,
    },
  });
}
