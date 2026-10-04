-- Option 1: replace TRUE 'unlimited' with large FIXED word buckets.
-- One-time pricing => bounded, forever-safe cost. Text is cheap so big buckets
-- feel "unlimited" while keeping cost per sale under ~$1.

-- Turn off true-unlimited everywhere.
update public.plans set is_unlimited = false where is_unlimited = true;

-- Generous fixed buckets for the previously-unlimited plans.
update public.plans set monthly_words = 1000000 where name = 'OTO1 Unlimited';
update public.plans set monthly_words = 2000000 where name = 'OTO6 Agency';
update public.plans set monthly_words = 2000000 where name = 'OTO9 Enterprise';
update public.plans set monthly_words = 2000000 where name = 'All-Access Bundle';
update public.plans set monthly_words = 500000  where name = 'DS Agency Lite';

-- Reset any user profiles currently flagged unlimited to a fixed bucket.
update public.profiles
  set is_unlimited = false,
      words_remaining = greatest(words_remaining, 1000000)
  where is_unlimited = true;
