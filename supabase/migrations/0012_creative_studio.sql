-- Creative Studio: AI Image (gpt-image-2) + Video (p-video) generation.
-- Credits are ONE-TIME consumable counts (not monthly), separate from words.

alter table public.plans
  add column if not exists feature_media  boolean not null default false,
  add column if not exists image_credits  bigint  not null default 0,
  add column if not exists video_credits  bigint  not null default 0;

alter table public.profiles
  add column if not exists feature_media  boolean not null default false,
  add column if not exists image_credits  bigint  not null default 0,
  add column if not exists video_credits  bigint  not null default 0;

-- Atomic decrement helpers (clamp at 0).
create or replace function public.decrement_image_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  update public.profiles set image_credits = greatest(image_credits - p_n, 0)
  where id = p_user returning image_credits into remaining;
  return remaining;
end; $$;

create or replace function public.decrement_video_credits(p_user uuid, p_n bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare remaining bigint;
begin
  update public.profiles set video_credits = greatest(video_credits - p_n, 0)
  where id = p_user returning video_credits into remaining;
  return remaining;
end; $$;

-- Two Creative Studio plans.
insert into public.plans
  (name, monthly_words, price, is_active, feature_media, image_credits, video_credits)
values
  ('Creative Studio Silver', 20000, 47, true, true, 150, 25),
  ('Creative Studio Gold',   20000, 87, true, true, 500, 50)
on conflict do nothing;

-- Bundle includes media too.
update public.plans
  set feature_media = true, image_credits = 500, video_credits = 50
  where name = 'All-Access Bundle';
