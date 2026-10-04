import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getUpgradeUrl } from "@/lib/settings";
import TemplatesClient from "@/components/TemplatesClient";
import type { Template } from "@/types/db";

export default async function TemplatesPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const [{ data: templates }, { data: favorites }] = await Promise.all([
    supabase.from("templates").select("*").eq("is_active", true).order("category"),
    supabase.from("favorites").select("template_id").eq("user_id", profile.id),
  ]);

  return (
    <TemplatesClient
      templates={(templates as Template[]) ?? []}
      favoriteIds={(favorites ?? []).map((f) => f.template_id)}
      userId={profile.id}
      templateLevel={profile.template_level ?? 0}
      upgradeUrl={(await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null}
    />
  );
}
