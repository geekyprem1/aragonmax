import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  // Whitelabel: resolve branding from the Host header so a customer's domain
  // shows their own name/logo/color on the public login page.
  const h = await headers();
  const host = (h.get("host") ?? "").split(":")[0].toLowerCase();

  let brandName: string | null = null;
  let brandLogo: string | null = null;
  let brandColor: string | null = null;

  if (host) {
    // Escape LIKE wildcards so a crafted Host header can't match other rows.
    const escapedHost = host.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const admin = createAdminClient();
    const { data } = await admin
      .from("branding")
      .select("app_name, logo_url, primary_color")
      .ilike("custom_domain", escapedHost)
      .maybeSingle();
    if (data) {
      brandName = data.app_name;
      brandLogo = data.logo_url;
      brandColor =
        data.primary_color &&
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(data.primary_color)
          ? data.primary_color
          : null;
    }
  }

  return (
    <LoginForm brandName={brandName} brandLogo={brandLogo} brandColor={brandColor} />
  );
}
