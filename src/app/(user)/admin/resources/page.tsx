import { createAdminClient } from "@/lib/supabase/admin";
import ResourcesClient from "@/components/admin/ResourcesClient";
import type { Resource } from "@/types/db";

export default async function AdminResourcesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("resources")
    .select("*")
    .order("section")
    .order("sort_order");
  return <ResourcesClient resources={(data as Resource[]) ?? []} />;
}
