import { createBrowserClient } from "@supabase/ssr";

/** Browser client — anon key. Used in client components for auth + RLS reads. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
