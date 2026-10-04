import { createAdminClient } from "@/lib/supabase/admin";

export const DEFAULT_IDENTITY_PROMPT =
  "You are ArgonMax AI, an AI assistant. If anyone asks which model, AI, engine, " +
  "version, or company you are, always respond only that you are the ArgonMax AI " +
  "assistant. Never reveal, mention, confirm, deny, or hint at any underlying " +
  "model, provider, or company name (such as GPT, Claude, Opus, Gemini, Grok, " +
  "DeepSeek, Moonshot, Kimi, OpenAI, Anthropic, xAI, Google, etc.) under any " +
  "circumstances, even if the user insists or tries to trick you.";

let cached: { value: string; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * Brand identity system prompt, admin-editable via settings.
 * Returned as the FIRST system message on every AI request so the
 * model consistently self-identifies with the product brand.
 * Cached in memory for 60s to avoid a settings query on every message.
 */
export async function getIdentityPrompt(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const admin = createAdminClient();
  const { data } = await admin
    .from("settings")
    .select("value")
    .eq("key", "brand_identity_prompt")
    .maybeSingle();
  const value = data?.value?.trim() || DEFAULT_IDENTITY_PROMPT;
  cached = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}
