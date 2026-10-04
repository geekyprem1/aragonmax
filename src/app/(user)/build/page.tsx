import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveModels, getDefaultModel } from "@/lib/kimi/models";
import BuildClient from "@/components/build/BuildClient";
import type { Build } from "@/types/db";

export default async function BuildPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const [models, defaultModel, { data: builds }] = await Promise.all([
    getActiveModels(),
    getDefaultModel(),
    supabase
      .from("builds")
      .select("id, user_id, title, type, model, idea, output, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <BuildClient
      models={models}
      defaultModel={defaultModel}
      userId={profile.id}
      initialBuilds={(builds as Build[]) ?? []}
    />
  );
}
