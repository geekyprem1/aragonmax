import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Removes a user's generated media files before the account is deleted.
 * Generation rows cascade with the profile, but storage objects do not.
 */
export async function deleteUserMediaFiles(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("generations")
    .select("storage_path")
    .eq("user_id", userId);
  const paths = (data ?? [])
    .map((r) => r.storage_path)
    .filter((p): p is string => !!p);
  if (!paths.length) return;
  const { error } = await admin.storage.from("media").remove(paths);
  if (error) console.error("media cleanup failed:", error.message);
}
