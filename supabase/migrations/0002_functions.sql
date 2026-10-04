-- Atomic word deduction. Clamps to 0 (last-request overshoot allowed).
create or replace function public.decrement_words(p_user uuid, p_words bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining bigint;
begin
  update public.profiles
     set words_remaining = greatest(words_remaining - p_words, 0)
   where id = p_user
  returning words_remaining into remaining;
  return remaining;
end;
$$;

-- Helper: is the current auth user an admin? (used by RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
