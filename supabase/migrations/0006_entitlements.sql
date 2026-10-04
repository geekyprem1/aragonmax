-- Phase A: Entitlement foundation for OTOs.
-- Entitlements live on BOTH plans (presets) and profiles (source of truth for
-- gating). Assigning a plan copies its presets onto the profile; admin can then
-- fine-tune per user (needed to stack OTO purchases).

-- ── plans: preset entitlements ───────────
alter table public.plans
  add column if not exists is_unlimited    boolean not null default false,
  add column if not exists template_level  int     not null default 0,
  add column if not exists feature_pro     boolean not null default false,
  add column if not exists feature_bulk    boolean not null default false,
  add column if not exists feature_traffic boolean not null default false,
  add column if not exists is_agency       boolean not null default false,
  add column if not exists agency_accounts int     not null default 0,
  add column if not exists seats           int     not null default 1,
  add column if not exists is_whitelabel   boolean not null default false,
  add column if not exists is_reseller     boolean not null default false,
  add column if not exists is_vip          boolean not null default false;

-- ── profiles: effective entitlements ─────
alter table public.profiles
  add column if not exists is_unlimited    boolean not null default false,
  add column if not exists template_level  int     not null default 0,
  add column if not exists feature_pro     boolean not null default false,
  add column if not exists feature_bulk    boolean not null default false,
  add column if not exists feature_traffic boolean not null default false,
  add column if not exists is_agency       boolean not null default false,
  add column if not exists agency_accounts int     not null default 0,
  add column if not exists seats           int     not null default 1,
  add column if not exists is_whitelabel   boolean not null default false,
  add column if not exists is_reseller     boolean not null default false,
  add column if not exists is_vip          boolean not null default false;

-- ── templates: tier (0 free · 1 bump · 2 premium/DFY) ──
alter table public.templates
  add column if not exists tier int not null default 0;

-- ── Funnel plan presets ──────────────────
-- Adjust words/prices/purchase_url later in Admin > Plans.
insert into public.plans
  (name, monthly_words, price, is_active, is_unlimited, template_level,
   feature_pro, feature_bulk, feature_traffic, is_agency, agency_accounts,
   seats, is_whitelabel, is_reseller, is_vip)
values
  ('ArgonMax FE',       20000,   17,  true, false, 0, false,false,false,false,0, 1, false,false,false),
  ('OTO1 Unlimited',    2000000, 37,  true, true,  0, false,false,false,false,0, 1, false,false,false),
  ('OTO2 Pro',          50000,   47,  true, false, 0, true, false,false,false,0, 1, false,false,false),
  ('OTO3 DFY',          50000,   67,  true, false, 2, false,false,false,false,0, 1, false,false,false),
  ('OTO4 Automation',   50000,   39,  true, false, 0, false,true, false,false,0, 1, false,false,false),
  ('OTO5 Traffic',      20000,   47,  true, false, 0, false,false,true, false,0, 1, false,false,false),
  ('OTO6 Agency',       200000,  97,  true, true,  2, true, true, false,true, 100,1, true, false,false),
  ('OTO7 Reseller',     50000,   67,  true, false, 0, false,false,false,false,0, 1, false,true, false),
  ('OTO8 Whitelabel',   200000,  197, true, false, 0, false,false,false,false,0, 1, true, false,false),
  ('OTO9 Enterprise',   500000,  127, true, true,  2, true, true, true, false,0, 10,false,false,true),
  ('OTO10 VIP',         50000,   97,  true, false, 0, false,false,false,false,0, 1, false,false,true),
  ('All-Access Bundle', 2000000, 247, true, true,  2, true, true, true, true, 100,10,true, true, true)
on conflict do nothing;
