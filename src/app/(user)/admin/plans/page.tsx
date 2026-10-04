import { createAdminClient } from "@/lib/supabase/admin";
import PlansClient from "@/components/admin/PlansClient";
import type { Plan } from "@/types/db";

export default async function AdminPlansPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("plans").select("*").order("monthly_words");
  return <PlansClient plans={(data as Plan[]) ?? []} />;
}
