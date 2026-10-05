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
    return {
      status: 402,
      error: "You have run out of words. Please top up your balance or upgrade your plan.",
    };
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
  const { data, error } = await admin.rpc("words_used_today", { p_user: userId });
  if (error) {
    console.error("words_used_today failed:", error.message);
    return 0;
  }
  return Number(data ?? 0);
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
    const raw = await getSetting("daily_word_cap");
    const parsed = raw === null || raw.trim() === "" ? 200000 : Number(raw);
    const cap = Number.isFinite(parsed) ? parsed : 200000;
    if (cap > 0) {
      const used = await wordsUsedToday(userId);
      if (used >= cap) return { ok: false, reason: "daily", profile };
    }
    return { ok: true, profile };
  }

  if (profile.words_remaining <= 0) return { ok: false, reason: "empty", profile };
  return { ok: true, profile };
}

export type Reservation =
  | { ok: true; reserved: number; remaining: number }
  | { ok: false };

/**
 * Atomically reserves up to `amount` words before a generation starts, so
 * parallel requests can't spend the same balance. Partial reservations are
 * allowed; the unused part is refunded by settleWords.
 */
export async function reserveWords(params: {
  userId: string;
  amount: number;
  unlimited?: boolean;
}): Promise<Reservation> {
  if (params.unlimited) return { ok: true, reserved: 0, remaining: -1 };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_words", {
    p_user: params.userId,
    p_amount: Math.max(1, Math.round(params.amount)),
  });
  if (error) {
    console.error("reserve_words failed:", error.message);
    throw new Error("Credit system unavailable");
  }
  if (data === null || data === undefined) return { ok: false };
  const row = data as { reserved: number; remaining: number };
  return {
    ok: true,
    reserved: Number(row.reserved),
    remaining: Number(row.remaining),
  };
}

/**
 * Settles usage after a generation (or cancellation/error): charges the
 * actual words and refunds whatever the reservation did not use. Never
 * throws — billing failures are logged and reported as `remaining: null`.
 */
export async function settleWords(params: {
  userId: string;
  reserved: number;
  outputText: string;
  module: AiModule;
  model: string;
  unlimited?: boolean;
}): Promise<{ words: number; remaining: number | null }> {
  const words = countWords(params.outputText);
  const admin = createAdminClient();

  let remaining: number | null = null;
  if (!params.unlimited) {
    const { data, error } = await admin.rpc("settle_words", {
      p_user: params.userId,
      p_reserved: params.reserved,
      p_actual: words,
    });
    if (error) console.error("settle_words failed:", error.message);
    else remaining = Number(data ?? 0);
  }

  if (words > 0) {
    const { error } = await admin.from("usage_logs").insert({
      user_id: params.userId,
      module: params.module,
      words_used: words,
      model: params.model,
    });
    if (error) console.error("usage_logs insert failed:", error.message);
  }

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

/**
 * Atomically reserves one media credit before submitting a paid provider
 * job. `ok: false` means the balance was insufficient.
 */
export async function reserveMediaCredit(
  userId: string,
  kind: MediaKind
): Promise<{ ok: boolean; remaining: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_media_credits", {
    p_user: userId,
    p_kind: kind,
    p_n: 1,
  });
  if (error) {
    console.error("reserve_media_credits failed:", error.message);
    throw new Error("Credit system unavailable");
  }
  if (data === null || data === undefined) return { ok: false, remaining: 0 };
  return { ok: true, remaining: Number(data) };
}

/** Refunds a reserved media credit (failed submission or terminal failure). */
export async function refundMediaCredit(
  userId: string,
  kind: MediaKind
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_media_credits", {
    p_user: userId,
    p_kind: kind,
    p_n: 1,
  });
  if (error) console.error("refund_media_credits failed:", error.message);
}
