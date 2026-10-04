-- Fair-use daily word cap for Unlimited plans (abuse protection).
-- 0 = no cap. Default 200,000 words/day (very generous for normal use).
insert into public.settings (key, value) values
  ('daily_word_cap', '200000')
on conflict (key) do nothing;
