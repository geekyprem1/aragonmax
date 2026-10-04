import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPrediction, outputUrl, ReplicateError } from "@/lib/replicate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const p = await getPrediction(id);
    // Do not expose the upstream URL; the client uses /api/media/file?id=...
    return NextResponse.json({
      status: p.status,
      done: p.status === "succeeded" && !!outputUrl(p.output),
      error: p.error ?? null,
    });
  } catch (err) {
    const status = err instanceof ReplicateError ? err.status : 500;
    return NextResponse.json({ error: "Status check failed" }, { status });
  }
}
