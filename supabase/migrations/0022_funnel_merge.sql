-- Funnel restructure:
--   * OTO1 + OTO2 merged into one "Unlimited Pro" offer
--     (unlimited words + advanced AI: feature_pro). Price $47, DS $27.
--   * Creative Studio becomes OTO2 "Creative PRO":
--     Gold ($87) is the main OTO, Silver ($47) is its downsell.
-- Plans are matched by their current seed names. Idempotent where possible.

-- ── OTO1 Unlimited Pro ($47) ──────────────────────────────
-- Was "OTO1 Unlimited" ($37, unlimited words only). Add Pro features,
-- bump price to $47, rename.
update public.plans
   set name         = 'OTO1 Unlimited Pro',
       price        = 47,
       is_unlimited = true,
       monthly_words = greatest(monthly_words, 1000000),
       feature_pro  = true
 where name = 'OTO1 Unlimited';

-- Old standalone "OTO2 Pro" is now folded into OTO1. Retire it so it no
-- longer shows as a separate purchasable offer. (Kept out of the active
-- list rather than deleted, in case any profile was assigned to it.)
update public.plans
   set is_active = false
 where name = 'OTO2 Pro';

-- ── OTO1 downsell: Unlimited Pro Lite ($27) ───────────────
-- Was "DS Unlimited Lite" (200k words). Now also carries Chat-with-PDF
-- (feature_pro) per the merged downsell spec.
update public.plans
   set name        = 'DS Unlimited Pro Lite',
       price       = 27,
       feature_pro = true
 where name = 'DS Unlimited Lite';

-- ── OTO2 Creative PRO (Gold main / Silver DS) ─────────────
-- Rename the two Creative Studio plans to reflect their OTO2 role.
update public.plans
   set name  = 'OTO2 Creative PRO Gold',
       price = 87
 where name = 'Creative Studio Gold';

update public.plans
   set name  = 'DS Creative PRO Silver',
       price = 47
 where name = 'Creative Studio Silver';
