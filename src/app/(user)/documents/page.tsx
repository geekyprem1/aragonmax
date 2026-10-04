import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import DocumentsClient from "@/components/DocumentsClient";

export default async function DocumentsPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);
  if (!ent.feature_pro) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Chat with Documents</h1>
        <p className="mb-6 text-sm text-muted">
          Upload a PDF and ask questions about it. Unlock with the Pro upgrade.
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

  return <DocumentsClient />;
}
