-- Billing integrity:
-- 1) Up-front atomic reservations for words and media credits.
-- 2) Exactly-once settlement after generation (partial usage included).
-- 3) Atomic admin word grants and SQL-side usage aggregation.
-- Execute privileges are service-role only.

-- ── Words: reserve up to p_amount atomically (partial allowed) ──
create or replace function public.reserve_words(p_user uuid, p_amount bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  before_balance bigint;
  after_balance bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'reserve_words: amount must be positive' using errcode = '22023';
  end if;
  select words_remaining into before_balance
    from public.profiles
   where id = p_user
     for update;
  if before_balance is null or before_balance <= 0 then
    return null;
  end if;
  after_balance := greatest(before_balance - p_amount, 0);
  update public.profiles set words_remaining = after_balance where id = p_user;
  return jsonb_build_object(
    'reserved', before_balance - after_balance,
    'remaining', after_balance
  );
end;
$$;

-- ── Words: settle reserved vs actual (refunds the unused part) ──
create or replace function public.settle_words(p_user uuid, p_reserved bigint, p_actual bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  if p_reserved is null or p_reserved < 0 or p_actual is null or p_actual < 0 then
    raise exception 'settle_words: amounts must be >= 0' using errcode = '22023';
  end if;
  update public.profiles
     set words_remaining = greatest(words_remaining + p_reserved - p_actual, 0)
   where id = p_user
  returning words_remaining into remaining;
  return remaining;
end;
$$;

-- ── Words: atomic admin grant/correction ──
create or replace function public.add_words(p_user uuid, p_amount bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  if p_amount is null then
    raise exception 'add_words: amount required' using errcode = '22023';
  end if;
  update public.profiles
     set words_remaining = greatest(words_remaining + p_amount, 0)
   where id = p_user
  returning words_remaining into remaining;
  return remaining;
end;
$$;

-- ── Media: reserve credits (all-or-nothing) ──
create or replace function public.reserve_media_credits(p_user uuid, p_kind text, p_n bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  if p_n is null or p_n <= 0 then
    raise exception 'reserve_media_credits: amount must be positive' using errcode = '22023';
  end if;
  if p_kind = 'image' then
    update public.profiles
       set image_credits = image_credits - p_n
     where id = p_user and image_credits >= p_n
    returning image_credits into remaining;
  elsif p_kind = 'video' then
    update public.profiles
       set video_credits = video_credits - p_n
     where id = p_user and video_credits >= p_n
    returning video_credits into remaining;
  else
    raise exception 'reserve_media_credits: invalid kind' using errcode = '22023';
  end if;
  return remaining;
end;
$$;

-- ── Media: refund credits (failed submission / terminal failure) ──
create or replace function public.refund_media_credits(p_user uuid, p_kind text, p_n bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  if p_n is null or p_n <= 0 then
    raise exception 'refund_media_credits: amount must be positive' using errcode = '22023';
  end if;
  if p_kind = 'image' then
    update public.profiles set image_credits = image_credits + p_n
     where id = p_user returning image_credits into remaining;
  elsif p_kind = 'video' then
    update public.profiles set video_credits = video_credits + p_n
     where id = p_user returning video_credits into remaining;
  else
    raise exception 'refund_media_credits: invalid kind' using errcode = '22023';
  end if;
  return remaining;
end;
$$;

-- ── Usage aggregation (no 1000-row truncation) ──
create or replace function public.words_used_today(p_user uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(words_used), 0)::bigint
    from public.usage_logs
   where user_id = p_user
     and created_at >= (date_trunc('day', now() at time zone 'utc') at time zone 'utc');
$$;

create or replace function public.total_words_used()
returns bigint
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(words_used), 0)::bigint from public.usage_logs;
$$;

-- ── Lock down execution ──
revoke execute on function public.reserve_words(uuid, bigint) from public, anon, authenticated;
revoke execute on function public.settle_words(uuid, bigint, bigint) from public, anon, authenticated;
revoke execute on function public.add_words(uuid, bigint) from public, anon, authenticated;
revoke execute on function public.reserve_media_credits(uuid, text, bigint) from public, anon, authenticated;
revoke execute on function public.refund_media_credits(uuid, text, bigint) from public, anon, authenticated;
revoke execute on function public.words_used_today(uuid) from public, anon, authenticated;
revoke execute on function public.total_words_used() from public, anon, authenticated;

grant execute on function public.reserve_words(uuid, bigint) to service_role;
grant execute on function public.settle_words(uuid, bigint, bigint) to service_role;
grant execute on function public.add_words(uuid, bigint) to service_role;
grant execute on function public.reserve_media_credits(uuid, text, bigint) to service_role;
grant execute on function public.refund_media_credits(uuid, text, bigint) to service_role;
grant execute on function public.words_used_today(uuid) to service_role;
grant execute on function public.total_words_used() to service_role;
