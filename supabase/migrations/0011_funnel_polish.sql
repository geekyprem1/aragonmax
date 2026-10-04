-- Phase I: downsell plans + global upgrade URL.
-- The All-Access Bundle plan (all flags on) was seeded in 0006.

-- Global "see all upgrades" URL used by locked-feature CTAs (edit in Admin > Settings).
insert into public.settings (key, value) values
  ('upgrade_url', '')
on conflict (key) do nothing;

-- Downsell plans (lite versions offered when a buyer declines an OTO).
insert into public.plans
  (name, monthly_words, price, is_active, is_unlimited, template_level,
   feature_pro, feature_bulk, feature_traffic, is_agency, agency_accounts,
   seats, is_whitelabel, is_reseller, is_vip)
values
  ('DS Unlimited Lite', 200000, 27, true, false, 0, false,false,false,false,0, 1, false,false,false),
  ('DS DFY Lite',       50000,  37, true, false, 1, false,false,false,false,0, 1, false,false,false),
  ('DS Agency Lite',    100000, 67, true, true,  2, true, true, false,true, 25, 1, false,false,false)
on conflict do nothing;
