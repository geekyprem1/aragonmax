import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";
import AccountsManager from "@/components/AccountsManager";
import type { Profile } from "@/types/db";

export default async function TeamPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);
  if (ent.seats <= 1) {
    const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;
    return (
      <div className="mx-auto max-w-3xl px-8 py-16 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold">Team</h1>
        <p className="mb-6 text-sm text-muted">
          Add team members under your account. Unlock with the Team/Enterprise
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

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, words_remaining, created_at")
    .eq("parent_id", profile.id)
    .eq("member_type", "team")
    .order("created_at", { ascending: false });

  return (
    <AccountsManager
      mode="team"
      accounts={(data as Profile[]) ?? []}
      cap={Math.max(ent.seats - 1, 0)}
    />
  );
}
