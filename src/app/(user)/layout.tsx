import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Shell from "@/components/layout/Shell";
import type { Branding } from "@/types/db";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  // Whitelabel branding: sub-accounts inherit their parent's branding.
  const brandingOwner = profile.parent_id ?? profile.id;
  const supabase = await createClient();
  const { data } = await supabase
    .from("branding")
    .select("*")
    .eq("owner_id", brandingOwner)
    .maybeSingle();
  const brand = (data as Branding) ?? null;

  return (
    <>
      {brand?.primary_color && (
        <style>{`:root{--primary:${brand.primary_color};--primary-hover:${brand.primary_color};}`}</style>
      )}
      <Shell
        profile={profile}
        brandName={brand?.app_name ?? null}
        brandLogo={brand?.logo_url ?? null}
      >
        {children}
      </Shell>
    </>
  );
}
