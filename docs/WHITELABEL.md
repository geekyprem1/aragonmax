# Whitelabel Guide (OTO8)

A whitelabel buyer can rebrand the app to their own name, logo and color, and
optionally use their own domain.

## In-app branding
1. Assign the buyer a plan/feature with **Whitelabel** enabled (Admin > Users >
   Features, or the OTO8 plan).
2. They open **Branding** in the sidebar and set:
   - App name (replaces "ArgonMax")
   - Logo URL
   - Primary color (hex)
3. Changes apply to their own view (and their agency sub-accounts once Phase H
   is live).

## Custom domain (optional)
This is a single shared deployment, so a custom domain points to the same app:

1. In Vercel → your project → **Settings → Domains**, add the buyer's domain
   (e.g. `app.theirbrand.com`).
2. The buyer adds a DNS record at their registrar as Vercel instructs
   (usually a CNAME to `cname.vercel-dns.com`).
3. Once verified, the app loads on their domain with their branding.

> For fully separate whitelabel instances (their own database + deployment),
> duplicate the deploy with their own Supabase project and env vars. That is a
> manual, higher-tier fulfillment option.
