import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import ResourceList from "@/components/ResourceList";
import type { Resource } from "@/types/db";

export default async function TrainingPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);
  const canTraining = ent.feature_traffic || ent.is_vip;

  if (!canTraining) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Training & Traffic</h1>
        <p className="mb-6 text-sm text-muted">
          Unlock video training, traffic playbooks and lead-gen resources.
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
  const sections = ent.is_vip ? ["training", "vip"] : ["training"];
  const { data } = await supabase
    .from("resources")
    .select("*")
    .in("section", sections)
    .order("sort_order");

  const resources = (data as Resource[]) ?? [];
  const training = resources.filter((r) => r.section === "training");
  const vip = resources.filter((r) => r.section === "vip");

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="mb-6 text-xl font-semibold">Training & Traffic</h1>
      <ResourceList title="Traffic & Training" items={training} />
      {ent.is_vip && (
        <div className="mt-8">
          <ResourceList title="⭐ VIP Exclusive" items={vip} />
        </div>
      )}
    </div>
  );
}
