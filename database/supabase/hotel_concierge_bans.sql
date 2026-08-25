-- =============================================================================
-- OtelApps — Bany hostů v Concierge chatu
-- =============================================================================

create table if not exists public.hotel_concierge_bans (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_external_id text not null,
  guest_display_name text,
  room_number text,
  duration_key text not null check (duration_key in ('30m', '1h', '8h', 'until_checkout')),
  reason text not null,
  banned_at timestamptz not null default now(),
  expires_at timestamptz,
  banned_by_user_id bigint,
  banned_by_label text not null default 'staff',
  conversation_id uuid references public.hotel_concierge_conversations (id) on delete set null,
  chat_snapshot jsonb not null default '[]'::jsonb,
  lifted_at timestamptz,
  lifted_by_user_id bigint,
  lifted_by_label text,
  created_at timestamptz not null default now(),
  constraint hotel_concierge_bans_reason_not_blank
    check (length(trim(reason)) > 0),
  constraint hotel_concierge_bans_snapshot_is_array
    check (jsonb_typeof(chat_snapshot) = 'array')
);

create index if not exists idx_hcb_hotel_guest_banned
  on public.hotel_concierge_bans (hotel_id, guest_external_id, banned_at desc);

create index if not exists idx_hcb_hotel_active
  on public.hotel_concierge_bans (hotel_id, guest_external_id)
  where lifted_at is null;

comment on table public.hotel_concierge_bans is
  'Bany hostů z Concierge chatu — audit + snapshot konverzace v okamžiku banu.';

alter table public.hotel_concierge_bans enable row level security;

drop policy if exists "hcb_public_read" on public.hotel_concierge_bans;
-- Anon/authenticated čtou jen přes SECURITY DEFINER RPC, ne přímo.

create or replace function public.active_concierge_ban_reason(
  p_hotel_id uuid,
  p_guest_external_id text
)
returns table (reason text, expires_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.reason, b.expires_at
  from public.hotel_concierge_bans b
  where b.hotel_id = p_hotel_id
    and b.guest_external_id = trim(p_guest_external_id)
    and b.lifted_at is null
    and (b.expires_at is null or b.expires_at > now())
  order by b.banned_at desc
  limit 1;
$$;

create or replace function public.check_guest_concierge_access(
  p_hotel_slug text,
  p_guest_external_id text
)
returns table (allowed boolean, reason text, expires_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_reason text;
  v_expires timestamptz;
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    return query select true, null::text, null::timestamptz;
    return;
  end if;

  select h.id into v_hotel_id
  from public.hotels h
  where h.slug = p_hotel_slug;

  if v_hotel_id is null then
    return query select true, null::text, null::timestamptz;
    return;
  end if;

  select r.reason, r.expires_at
    into v_reason, v_expires
  from public.active_concierge_ban_reason(v_hotel_id, p_guest_external_id) r;

  if v_reason is not null then
    return query select false, v_reason, v_expires;
    return;
  end if;

  return query select true, null::text, null::timestamptz;
end;
$$;

revoke all on function public.active_concierge_ban_reason(uuid, text) from public, anon, authenticated;
grant execute on function public.check_guest_concierge_access(text, text) to anon, authenticated;

create or replace function public.ensure_guest_concierge_conversation(
  p_hotel_slug text,
  p_guest_external_id text,
  p_guest_display_name text,
  p_room_number text,
  p_guest_locale text,
  p_conversation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_conversation_id uuid;
  v_ban_reason text;
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    raise exception 'Chybí guest_external_id.';
  end if;

  select h.id into v_hotel_id
  from public.hotels h
  where h.slug = p_hotel_slug;

  if v_hotel_id is null then
    raise exception 'Hotel "%" nenalezen.', p_hotel_slug;
  end if;

  select r.reason into v_ban_reason
  from public.active_concierge_ban_reason(v_hotel_id, p_guest_external_id) r;

  if v_ban_reason is not null then
    raise exception 'CONCIERGE_BANNED:%', v_ban_reason;
  end if;

  if p_conversation_id is not null then
    select c.id into v_conversation_id
    from public.hotel_concierge_conversations c
    where c.id = p_conversation_id
      and c.guest_external_id = p_guest_external_id;

    if v_conversation_id is not null then
      update public.hotel_concierge_conversations
      set guest_locale = coalesce(nullif(trim(p_guest_locale), ''), guest_locale),
          updated_at = now()
      where id = v_conversation_id;
      return v_conversation_id;
    end if;
  end if;

  select c.id into v_conversation_id
  from public.hotel_concierge_conversations c
  where c.hotel_id = v_hotel_id
    and c.guest_external_id = p_guest_external_id
  order by case when c.status = 'open' then 0 else 1 end,
           coalesce(c.last_message_at, c.created_at) desc
  limit 1;

  if v_conversation_id is not null then
    update public.hotel_concierge_conversations
    set guest_locale = coalesce(nullif(trim(p_guest_locale), ''), guest_locale),
        guest_display_name = coalesce(nullif(trim(p_guest_display_name), ''), guest_display_name),
        room_number = coalesce(nullif(trim(p_room_number), ''), room_number),
        status = 'open',
        updated_at = now()
    where id = v_conversation_id;
    return v_conversation_id;
  end if;

  insert into public.hotel_concierge_conversations (
    hotel_id,
    guest_external_id,
    guest_display_name,
    room_number,
    guest_locale,
    metadata
  )
  values (
    v_hotel_id,
    p_guest_external_id,
    coalesce(nullif(trim(p_guest_display_name), ''), 'Host'),
    nullif(trim(p_room_number), ''),
    coalesce(nullif(trim(p_guest_locale), ''), 'cs'),
    jsonb_build_object('mode', 'bot')
  )
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

create or replace function public.send_guest_concierge_message(
  p_conversation_id uuid,
  p_guest_external_id text,
  p_body text,
  p_locale text default 'cs'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message_id uuid;
  v_hotel_id uuid;
  v_ban_reason text;
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    raise exception 'Chybí guest_external_id.';
  end if;

  if p_body is null or trim(p_body) = '' then
    raise exception 'Zpráva je prázdná.';
  end if;

  select c.hotel_id into v_hotel_id
  from public.hotel_concierge_conversations c
  where c.id = p_conversation_id
    and c.guest_external_id = p_guest_external_id
    and c.status = 'open';

  if v_hotel_id is null then
    raise exception 'Konverzace nenalezena nebo není otevřená.';
  end if;

  select r.reason into v_ban_reason
  from public.active_concierge_ban_reason(v_hotel_id, p_guest_external_id) r;

  if v_ban_reason is not null then
    raise exception 'CONCIERGE_BANNED:%', v_ban_reason;
  end if;

  insert into public.hotel_concierge_messages (
    conversation_id,
    sender_type,
    body,
    locale
  )
  values (
    p_conversation_id,
    'guest',
    trim(p_body),
    coalesce(nullif(trim(p_locale), ''), 'cs')
  )
  returning id into v_message_id;

  return v_message_id;
end;
$$;

grant execute on function public.ensure_guest_concierge_conversation(text, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.send_guest_concierge_message(uuid, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
