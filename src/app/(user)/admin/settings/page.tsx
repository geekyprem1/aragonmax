import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveModels, getDefaultModel } from "@/lib/kimi/models";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data: settingsRows } = await admin
    .from("settings")
    .select("key, value")
    .in("key", ["brand_identity_prompt", "upgrade_url"]);
  const settingsMap = Object.fromEntries(
    (settingsRows ?? []).map((s) => [s.key, s.value ?? ""])
  );

  const [models, defaultModel] = await Promise.all([
    getActiveModels(),
    getDefaultModel(),
  ]);

  const baseUrl = process.env.MOONSHOT_BASE_URL || "https://api.moonshot.ai/v1";
  const apiKeySet = !!process.env.MOONSHOT_API_KEY;

  return (
    <SettingsClient
      identityPrompt={settingsMap["brand_identity_prompt"] ?? ""}
      upgradeUrl={settingsMap["upgrade_url"] ?? ""}
      models={models}
      defaultModel={defaultModel}
      baseUrl={baseUrl}
      apiKeySet={apiKeySet}
    />
  );
}
