import { requireAdminPage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminTemplatesClient from "@/components/admin/AdminTemplatesClient";
import type { Template } from "@/types/db";

export default async function AdminTemplatesPage() {
  await requireAdminPage();
  const admin = createAdminClient();
  const { data } = await admin.from("templates").select("*").order("category");
  return <AdminTemplatesClient templates={(data as Template[]) ?? []} />;
}
