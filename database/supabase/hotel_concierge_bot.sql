-- =============================================================================
-- Concierge AI — metadata.mode (bot|staff) + system zprávy v preview/unread
-- Spusť v Supabase SQL Editor po hotel_concierge_chat.sql / RPC migracích.
-- =============================================================================

-- Nové konverzace startují v bot módu
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

-- System zprávy (handoff) počítej hostovi jako nepřečtené + preview z překladu
create or replace function public.hotel_concierge_on_message_insert()
returns trigger
language plpgsql
as $$
declare
  v_mode text;
begin
  select coalesce(c.metadata->>'mode', 'bot')
    into v_mode
  from public.hotel_concierge_conversations c
  where c.id = new.conversation_id;

  update public.hotel_concierge_conversations c
  set
    last_message_preview = left(
      case
        when new.sender_type in ('staff', 'bot', 'system') then coalesce(new.body_translated, new.body)
        else new.body
      end,
      200
    ),
    last_message_at = new.created_at,
    updated_at = now(),
    -- Staff notifikace jen když chat řídí recepce nebo host čeká na převzetí
    unread_staff_count = case
      when new.sender_type = 'guest' and v_mode in ('staff', 'waiting')
        then c.unread_staff_count + 1
      else c.unread_staff_count
    end,
    unread_guest_count = case
      when new.sender_type in ('staff', 'bot', 'system') then c.unread_guest_count + 1
      else c.unread_guest_count
    end
  where c.id = new.conversation_id;
  return new;
end;
$$;

-- Vrátí handler_mode (bot|staff) pro mobilní UI
create or replace function public.get_guest_concierge_conversations(p_guest_external_id text)
returns table (
  id uuid,
  guest_display_name text,
  room_number text,
  guest_locale text,
  status text,
  handler_mode text,
  last_message_preview text,
  last_message_at timestamptz,
  unread_guest_count int,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    return;
  end if;

  return query
  select
    c.id,
    c.guest_display_name,
    c.room_number,
    c.guest_locale,
    c.status,
    coalesce(c.metadata->>'mode', 'bot') as handler_mode,
    c.last_message_preview,
    c.last_message_at,
    c.unread_guest_count,
    c.created_at,
    c.updated_at
  from public.hotel_concierge_conversations c
  where c.guest_external_id = p_guest_external_id
    and c.status <> 'archived'
  order by coalesce(c.last_message_at, c.created_at) desc;
end;
$$;

-- Jedna konverzace včetně módu (pro OnlineChat)
create or replace function public.get_guest_concierge_conversation(
  p_conversation_id uuid,
  p_guest_external_id text
)
returns table (
  id uuid,
  guest_locale text,
  status text,
  handler_mode text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    return;
  end if;

  return query
  select
    c.id,
    c.guest_locale,
    c.status,
    coalesce(c.metadata->>'mode', 'bot') as handler_mode
  from public.hotel_concierge_conversations c
  where c.id = p_conversation_id
    and c.guest_external_id = p_guest_external_id
  limit 1;
end;
$$;

grant execute on function public.get_guest_concierge_conversation(uuid, text) to anon, authenticated;

-- System zprávy označit jako přečtené spolu s bot/staff
create or replace function public.mark_concierge_read_by_guest(
  p_conversation_id uuid,
  p_guest_external_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    return;
  end if;

  if not exists (
    select 1
    from public.hotel_concierge_conversations c
    where c.id = p_conversation_id
      and c.guest_external_id = p_guest_external_id
  ) then
    return;
  end if;

  update public.hotel_concierge_messages m
  set read_by_guest_at = now()
  where m.conversation_id = p_conversation_id
    and m.sender_type in ('staff', 'bot', 'system')
    and m.read_by_guest_at is null;

  update public.hotel_concierge_conversations c
  set unread_guest_count = 0
  where c.id = p_conversation_id
    and c.guest_external_id = p_guest_external_id;
end;
$$;

-- Existující otevřené konverzace bez módu → bot
update public.hotel_concierge_conversations
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('mode', 'bot')
where coalesce(metadata->>'mode', '') = ''
  and status = 'open';
