import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import BulkClient from "@/components/BulkClient";

export default async function BulkPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);
  if (!ent.feature_bulk) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Bulk Generation</h1>
        <p className="mb-6 text-sm text-muted">
          Generate content for many items at once. Unlock with the Automation
          upgrade.
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

  return <BulkClient />;
}
