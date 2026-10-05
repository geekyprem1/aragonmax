import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import StudioClient from "@/components/StudioClient";
import type { Generation } from "@/types/db";

export default async function StudioPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  if (!getEntitlements(profile).feature_media) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Creative Studio</h1>
        <p className="mb-6 text-sm text-muted">
          Generate AI images and videos. Unlock with Creative Studio.
        </p>
        {upgradeUrl && (
          <a
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Upgrade to unlock
          </a>
        )}
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: gens }, { data: pending }] = await Promise.all([
    supabase
      .from("generations")
      .select("id, type")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(60),
    // Jobs submitted earlier that haven't finished (e.g. page was refreshed).
    supabase
      .from("media_jobs")
      .select("prediction_id, type, prompt, aspect_ratio")
      .eq("user_id", profile.id)
      .in("status", ["starting", "processing"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <StudioClient
      imageCredits={profile.image_credits ?? 0}
      videoCredits={profile.video_credits ?? 0}
      initialGenerations={(gens as Pick<Generation, "id" | "type">[]) ?? []}
      pendingJobs={(pending ?? []).map((p) => ({
        id: p.prediction_id,
        type: p.type as "image" | "video",
        prompt: p.prompt,
        ratio: p.aspect_ratio,
      }))}
    />
  );
}

