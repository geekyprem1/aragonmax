-- Agency/team child provisioning:
-- cap enforcement and word-pool transfer happen atomically under a parent
-- row lock, so parallel requests can't exceed caps or mint words.

create or replace function public.create_agency_child(
  p_parent uuid,
  p_child uuid,
  p_email text,
  p_mode text,
  p_cap int,
  p_words bigint,
  p_feature_pro boolean,
  p_feature_bulk boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_balance bigint;
  child_count int;
  alloc bigint;
begin
  if p_mode not in ('agency', 'team') then
    raise exception 'create_agency_child: invalid mode' using errcode = '22023';
  end if;
  if p_cap is null or p_cap < 0 then
    raise exception 'create_agency_child: invalid cap' using errcode = '22023';
  end if;

  -- Lock the parent row: serializes concurrent allocations (cap + pool).
  select words_remaining into parent_balance
    from public.profiles
   where id = p_parent
     for update;
  if parent_balance is null then
    return jsonb_build_object('ok', false, 'error', 'parent');
  end if;

  select count(*) into child_count
    from public.profiles
   where parent_id = p_parent and member_type = p_mode;
  if child_count >= p_cap then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;

  if p_words is null then
    -- Default allowance comes from the owner's own pool (no free minting).
    alloc := least(10000, parent_balance);
  else
    if p_words < 0 then
      raise exception 'create_agency_child: negative words' using errcode = '22023';
    end if;
    if p_words > parent_balance then
      return jsonb_build_object('ok', false, 'error', 'words', 'available', parent_balance);
    end if;
    alloc := p_words;
  end if;

  update public.profiles
     set words_remaining = parent_balance - alloc
   where id = p_parent;

  insert into public.profiles
    (id, email, role, parent_id, member_type, words_remaining, status, feature_pro, feature_bulk)
  values
    (p_child, p_email, 'user', p_parent, p_mode, alloc, 'active', p_feature_pro, p_feature_bulk);

  return jsonb_build_object('ok', true, 'allocated', alloc);
end;
$$;

revoke execute on function public.create_agency_child(uuid, uuid, text, text, integer, bigint, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.create_agency_child(uuid, uuid, text, text, integer, bigint, boolean, boolean)
  to service_role;
