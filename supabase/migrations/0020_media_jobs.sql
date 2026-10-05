-- Media pipeline tracking:
-- ownership for status/save, exactly-once refunds on terminal failure,
-- and resume-after-refresh for pending jobs.
-- Duplicate-save protection for generations.

create table if not exists public.media_jobs (
  prediction_id text primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in ('image', 'video')),
  prompt        text,
  aspect_ratio  text,
  status        text not null default 'starting',
  charged       boolean not null default true,
  refunded      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_media_jobs_user
  on public.media_jobs (user_id, created_at desc);

alter table public.media_jobs enable row level security;

-- Users read their own jobs; writes happen via service role only.
create policy "media_jobs_read_own" on public.media_jobs
  for select using (user_id = auth.uid() or public.is_admin());

-- Idempotent refund: flips refunded once and returns the credit.
create or replace function public.refund_media_credit_for_job(p_prediction_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  job record;
begin
  update public.media_jobs
     set refunded = true
   where prediction_id = p_prediction_id
     and refunded = false
     and charged = true
  returning user_id, type into job;
  if not found then
    return false;
  end if;
  if job.type = 'image' then
    update public.profiles set image_credits = image_credits + 1 where id = job.user_id;
  else
    update public.profiles set video_credits = video_credits + 1 where id = job.user_id;
  end if;
  return true;
end;
$$;

revoke execute on function public.refund_media_credit_for_job(text) from public, anon, authenticated;
grant execute on function public.refund_media_credit_for_job(text) to service_role;

-- ── generations: one row per (user, prediction) ──────────────
alter table public.generations
  add column if not exists prediction_id text;

do $$ begin
  alter table public.generations
    add constraint generations_user_prediction_unique unique (user_id, prediction_id);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;
