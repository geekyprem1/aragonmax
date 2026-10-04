import { createAdminClient } from "@/lib/supabase/admin";
import UsersClient from "@/components/admin/UsersClient";
import type { Plan, Profile } from "@/types/db";

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const [{ data: users }, { data: plans }] = await Promise.all([
    admin.from("profiles").select("*, plan:plans(*)").order("created_at", { ascending: false }),
    admin.from("plans").select("*").order("monthly_words"),
  ]);

  return (
    <UsersClient
      users={(users as Profile[]) ?? []}
      plans={(plans as Plan[]) ?? []}
    />
  );
}
