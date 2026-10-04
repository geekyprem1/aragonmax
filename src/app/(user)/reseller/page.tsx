import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import ResourceList from "@/components/ResourceList";
import type { Resource } from "@/types/db";

export default async function ResellerPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);

  if (!ent.is_reseller) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Reseller</h1>
        <p className="mb-6 text-sm text-muted">
          Get the reseller license and sell ArgonMax AI as your own — keep 100% of
          every sale.
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
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("section", "reseller")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <h1 className="mb-2 text-xl font-semibold">Reseller</h1>
      <p className="mb-6 text-sm text-muted">
        Your reseller kit and license. Sell ArgonMax AI and keep 100% of the profit.
      </p>
      <ResourceList title="Reseller Materials" items={(data as Resource[]) ?? []} />
    </div>
  );
}
