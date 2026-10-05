import { redirect } from "next/navigation";
import { getUser, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Shell from "@/components/layout/Shell";
import type { Branding } from "@/types/db";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireUser();
  if (!profile) {
    // Logged in but no profile row: don't bounce to /login (the proxy would
    // bounce back and loop). Show a dedicated error page instead.
    const user = await getUser();
    if (user) redirect("/no-profile");
    redirect("/login");
  }

  // Whitelabel branding: sub-accounts inherit their parent's branding.
  const brandingOwner = profile.parent_id ?? profile.id;
  const supabase = await createClient();
  const { data } = await supabase
    .from("branding")
    .select("*")
    .eq("owner_id", brandingOwner)
    .maybeSingle();
  const brand = (data as Branding) ?? null;

  // Defense in depth: only a strict hex color ever reaches the style tag.
  const brandColor =
    brand?.primary_color &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(brand.primary_color)
      ? brand.primary_color
      : null;

  return (
    <>
      {brandColor && (
        <style>{`:root{--primary:${brandColor};--primary-hover:${brandColor};}`}</style>
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
