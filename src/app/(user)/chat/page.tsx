import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { getActiveModels, getDefaultModel } from "@/lib/kimi/models";
import { getEntitlements } from "@/lib/entitlements";
import ChatClient from "@/components/chat/ChatClient";
import type { Conversation } from "@/types/db";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const { t } = await searchParams;
  const supabase = await createClient();

  const [models, defaultModel, { data: conversations }] = await Promise.all([
    getActiveModels(),
    getDefaultModel(),
    supabase
      .from("conversations")
      .select("id, user_id, title, model, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  let templateId: string | undefined;
  let personaName: string | undefined;
  if (t) {
    const { data } = await supabase
      .from("template_catalog")
      .select("name, tier")
      .eq("id", t)
      .maybeSingle();
    // Only apply the persona if the user's plan unlocks this template tier.
    if (data && (data.tier ?? 0) <= (profile.template_level ?? 0)) {
      templateId = t;
      personaName = data.name;
    }
  }

  return (
    <ChatClient
      models={models}
      defaultModel={defaultModel}
      templateId={templateId}
      personaName={personaName}
      userId={profile.id}
      initialConversations={(conversations as Conversation[]) ?? []}
      pro={getEntitlements(profile).feature_pro}
    />
  );
}
