import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Only the requester (tracked at submission time) can query a prediction.
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("media_jobs")
    .select("user_id, status")
    .eq("prediction_id", id)
    .maybeSingle();
  if (!job || job.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const p = await getPrediction(id);

    // Keep the job row in sync (best effort) and refund terminal failures once.
    if (p.status !== job.status) {
      await admin
        .from("media_jobs")
        .update({ status: p.status })
        .eq("prediction_id", id);
    }
    if (p.status === "failed" || p.status === "canceled") {
      await admin.rpc("refund_media_credit_for_job", { p_prediction_id: id });
    }

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
