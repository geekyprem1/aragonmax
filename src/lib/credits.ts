import { createAdminClient } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/settings";
import { countWords } from "@/lib/words";
import type { AiModule, Profile } from "@/types/db";

export interface CreditCheck {
  ok: boolean;
  reason?: "disabled" | "empty" | "daily";
  profile?: Profile;
}

/** Maps a failed credit check to an HTTP status + message. */
export function creditError(reason?: CreditCheck["reason"]): {
  status: number;
  error: string;
} {
  if (reason === "empty")
    return { status: 402, error: "You have run out of words. Please upgrade your plan." };
  if (reason === "daily")
    return {
      status: 429,
      error: "Daily fair-use limit reached. It resets at midnight (UTC).",
    };
  return { status: 403, error: "Your account is disabled. Contact the administrator." };
}

/** Words used by this user since midnight UTC (for the fair-use cap). */
async function wordsUsedToday(userId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { data } = await admin
    .from("usage_logs")
    .select("words_used")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString());
  return (data ?? []).reduce((s, r) => s + Number(r.words_used), 0);
}

/** Pre-flight: user active + has words (or unlimited within daily cap). */
export async function preCheckCredits(userId: string): Promise<CreditCheck> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const profile = data as Profile | null;
  if (!profile) return { ok: false, reason: "disabled" };
  if (profile.status !== "active") return { ok: false, reason: "disabled" };

  // Unlimited plans: no balance limit, but enforce a daily fair-use cap.
  if (profile.is_unlimited) {
    const cap = Number((await getSetting("daily_word_cap")) || "200000");
    if (cap > 0) {
      const used = await wordsUsedToday(userId);
      if (used >= cap) return { ok: false, reason: "daily", profile };
    }
    return { ok: true, profile };
  }

  if (profile.words_remaining <= 0) return { ok: false, reason: "empty", profile };
  return { ok: true, profile };
}

/**
 * Charge the user for generated output. Atomic decrement + usage log.
 * Returns words charged and remaining balance.
 */
export async function chargeWords(params: {
  userId: string;
  outputText: string;
  module: AiModule;
  model: string;
  unlimited?: boolean;
}): Promise<{ words: number; remaining: number }> {
  const words = countWords(params.outputText);
  const admin = createAdminClient();

  let remaining = -1; // -1 signals unlimited (no deduction)
  if (!params.unlimited) {
    const { data } = await admin.rpc("decrement_words", {
      p_user: params.userId,
      p_words: words,
    });
    remaining = Number(data ?? 0);
  }

  // Always log usage (for analytics), even on unlimited plans.
  await admin.from("usage_logs").insert({
    user_id: params.userId,
    module: params.module,
    words_used: words,
    model: params.model,
  });

  return { words, remaining };
}


export type MediaKind = "image" | "video";

export interface MediaCheck {
  ok: boolean;
  reason?: "disabled" | "no_access" | "empty";
  profile?: Profile;
}

/** Check media access + remaining credits for image/video generation. */
export async function preCheckMedia(
  userId: string,
  kind: MediaKind
): Promise<MediaCheck> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  const profile = data as Profile | null;
  if (!profile || profile.status !== "active")
    return { ok: false, reason: "disabled" };
  if (!profile.feature_media) return { ok: false, reason: "no_access", profile };
  const left = kind === "image" ? profile.image_credits : profile.video_credits;
  if ((left ?? 0) <= 0) return { ok: false, reason: "empty", profile };
  return { ok: true, profile };
}

/** Deduct one media credit (image or video). Returns remaining. */
export async function chargeMediaCredit(
  userId: string,
  kind: MediaKind
): Promise<number> {
  const admin = createAdminClient();
  const fn =
    kind === "image" ? "decrement_image_credits" : "decrement_video_credits";
  const { data } = await admin.rpc(fn, { p_user: userId, p_n: 1 });
  return Number(data ?? 0);
}
