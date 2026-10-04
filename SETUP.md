# ArgonMax AI — Setup Guide

Next.js + Supabase AI SaaS powered by ArgonMax AI. MVP.

## 1. Supabase project

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run ALL migrations in `supabase/migrations/` in order:
   - `0001_schema.sql` — core tables
   - `0002_functions.sql` — word deduction + is_admin
   - `0003_rls.sql` — row-level security
   - `0004_seed.sql` — base plans + identity + templates
   - `0005_templates.sql` — more free templates
   - `0006_entitlements.sql` — OTO entitlement columns + funnel plans
   - `0007_premium_templates.sql` — bump + premium (DFY) templates
   - `0008_resources.sql` — training/vip/reseller resources
   - `0009_branding.sql` — whitelabel branding
   - `0010_agency.sql` — agency/team sub-accounts
   - `0011_funnel_polish.sql` — downsell plans + upgrade URL
   - `0012_creative_studio.sql` — image/video credits + studio plans
   - `0013_media_storage.sql` — private media bucket + generations table
   - `0014_daily_cap.sql` — daily word cap setting
   - `0015_fixed_buckets.sql` — fixed word buckets for "unlimited" plans
   - `0016_builds.sql` — build history table
   Run each once, in numeric order.

   **Shortcut:** `supabase/run_all_migrations.sql` is all of the above combined into one file — run that once in the SQL Editor instead. It runs inside a single transaction (any error rolls back everything) and only works on a fresh project.
3. From **Project Settings > API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret)

## 2. Environment

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MOONSHOT_API_KEY=...            # optional; can also set in Admin > Settings
MOONSHOT_BASE_URL=https://api.moonshot.ai/v1
```

## 3. Create the first admin (bootstrap)

There is no public signup. Create your admin account once, manually:

1. Supabase Dashboard > **Authentication > Users > Add user** — set email + password, and tick "Auto confirm".
2. Copy the new user's UUID.
3. In **SQL Editor**, insert the profile as admin (replace values):

```sql
insert into public.profiles (id, email, role, words_remaining, status)
values ('PASTE-USER-UUID', 'you@example.com', 'admin', 999999999, 'active')
on conflict (id) do update set role = 'admin';
```

After this you can log in and create all other users from **Admin > Users**.

## 4. AI provider & models (via .env)

Everything about the AI provider lives in environment variables:

```
MOONSHOT_API_KEY=...        # your OpenRouter (or Moonshot) key
MOONSHOT_BASE_URL=https://openrouter.ai/api/v1   # or https://api.moonshot.ai/v1
KIMI_MODELS=[{"key":"moonshotai/kimi-k2","name":"ArgonMax K3","badge":"Recommended"},{"key":"deepseek/deepseek-chat","name":"ArgonMax K3 Pro"}]
KIMI_DEFAULT_MODEL=moonshotai/kimi-k2
```

- `key`  = the real model id the provider expects (see https://openrouter.ai/models).
- `name` = what the user sees in the app (e.g. "ArgonMax K3").
- To change models, edit `KIMI_MODELS` / `KIMI_DEFAULT_MODEL` and redeploy.

**Admin > Settings** now only edits the brand identity prompt; the provider and
model list are shown there read-only for reference.

## 5. Run

```
npm install
npm run dev      # http://localhost:3000
```

## 6. How it works (quick)

- **Users**: admin creates them (email/password) and assigns a plan + word credits.
- **Credits**: every AI generation deducts **words** (output) atomically. When a
  user hits 0 they're blocked and shown an upgrade CTA linking to the plan's
  JVZoo/WarriorPlus URL.
- **Upgrades**: after a buyer pays on JVZoo/W+, you manually bump their plan and
  words in **Admin > Users** (100% manual, no webhook in MVP).
- **Templates**: expert personas / writing / coding presets. Clicking one opens
  chat pre-loaded with that system prompt. Manage them in **Admin > Templates**.
- **Security**: Moonshot key and service-role key are server-only. All AI calls
  and credit changes happen in server route handlers. RLS is on for every table.

## Notes

- Set the real JVZoo/WarriorPlus links in **Admin > Plans** (`purchase_url`).
- Verify model IDs before selling — update the `models` table if the
  official model API identifier differs from `kimi-k3`.
