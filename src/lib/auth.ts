import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";
import type { Session } from "@supabase/supabase-js";

/** Current Supabase session (or null). */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/** Authenticated user (verified via getUser). */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Full profile of the current user, with plan joined. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, plan:plans(*)")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Returns profile or null — caller decides how to handle missing auth. */
export async function requireUser(): Promise<Profile | null> {
  return getProfile();
}

/** Returns profile only if admin, else null. */
export async function requireAdmin(): Promise<Profile | null> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") return null;
  return profile;
}
