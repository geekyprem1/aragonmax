import { createAdminClient } from "@/lib/supabase/admin";

/** Read a single app setting value (server-side). */
export async function getSetting(key: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

/** Global "see all upgrades" URL for locked-feature CTAs. */
export async function getUpgradeUrl(): Promise<string | null> {
  const v = await getSetting("upgrade_url");
  return v && v.trim() ? v.trim() : null;
}
