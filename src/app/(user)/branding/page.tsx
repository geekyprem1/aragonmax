import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import BrandingClient from "@/components/BrandingClient";
import type { Branding } from "@/types/db";

export default async function BrandingPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  if (!getEntitlements(profile).is_whitelabel) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Whitelabel Branding</h1>
        <p className="mb-6 text-sm text-muted">
          Put your own brand name, logo and colors on the app. Unlock with the
          Whitelabel upgrade.
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
    .from("branding")
    .select("*")
    .eq("owner_id", profile.id)
    .maybeSingle();

  return <BrandingClient branding={(data as Branding) ?? null} />;
}
