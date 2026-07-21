-- =============================================================================
-- OtelApps Concierge — KOMPLETNÍ CATCH-UP (idempotentní)
-- Spusť celý skript v Supabase → SQL Editor → Run
--
-- Předpoklad: tabulky hotel_concierge_conversations + hotel_concierge_messages
--             a public.hotels už existují (základní hotel_concierge_chat.sql).
--
-- Co tento skript nastaví / přepíše na finální verzi:
--  1) ensure / list / detail / messages / send / mark-read RPC
--  2) metadata.mode = bot|waiting|staff
--  3) unread_staff jen ve waiting|staff (ne AI bot)
--  4) host neuvidí staff/bot zprávu, dokud není body_translated (non-CS)
--  5) unread_guest až po překladu
--  6) case summaries (vyřešené chaty → kartičky)
--  7) Realtime RLS pro WebAdmin staff JWT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Ensure conversation (aktualizuje guest_locale, start v bot módu)
-- -----------------------------------------------------------------------------
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
    and c.status = 'open'
  order by coalesce(c.last_message_at, c.created_at) desc
  limit 1;

  if v_conversation_id is not null then
    update public.hotel_concierge_conversations
    set guest_locale = coalesce(nullif(trim(p_guest_locale), ''), guest_locale),
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

-- -----------------------------------------------------------------------------
-- 2) Seznam konverzací hosta (+ handler_mode)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3) Detail konverzace (+ handler_mode)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 4) Zprávy pro hosta — staff/bot až po překladu (non-CS)
-- -----------------------------------------------------------------------------
create or replace function public.get_guest_concierge_messages(
  p_conversation_id uuid,
  p_guest_external_id text
)
returns table (
  id uuid,
  sender_type text,
  body text,
  body_translated text,
  locale text,
  staff_display_name text,
  created_at timestamptz
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
    m.id,
    m.sender_type,
    m.body,
    m.body_translated,
    m.locale,
    m.staff_display_name,
    m.created_at
  from public.hotel_concierge_messages m
  join public.hotel_concierge_conversations c on c.id = m.conversation_id
  where m.conversation_id = p_conversation_id
    and c.guest_external_id = p_guest_external_id
    and not (
      m.sender_type in ('staff', 'bot')
      and coalesce(c.guest_locale, 'cs') <> 'cs'
      and (m.body_translated is null or trim(m.body_translated) = '')
    )
    and coalesce(m.staff_display_name, '') <> '__staff_only__'
  order by m.created_at asc;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5) Odeslání zprávy hosta
-- -----------------------------------------------------------------------------
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
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    raise exception 'Chybí guest_external_id.';
  end if;

  if p_body is null or trim(p_body) = '' then
    raise exception 'Zpráva je prázdná.';
  end if;

  if not exists (
    select 1
    from public.hotel_concierge_conversations c
    where c.id = p_conversation_id
      and c.guest_external_id = p_guest_external_id
      and c.status = 'open'
  ) then
    raise exception 'Konverzace nenalezena nebo není otevřená.';
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

-- -----------------------------------------------------------------------------
-- 6) Mark read by guest
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7) Trigger INSERT — unread_staff jen waiting|staff; unread_guest až když viditelné
-- -----------------------------------------------------------------------------
create or replace function public.hotel_concierge_on_message_insert()
returns trigger
language plpgsql
as $$
declare
  v_mode text;
  v_locale text;
  v_visible_to_guest boolean;
begin
  select
    coalesce(c.metadata->>'mode', 'bot'),
    coalesce(c.guest_locale, 'cs')
  into v_mode, v_locale
  from public.hotel_concierge_conversations c
  where c.id = new.conversation_id;

  v_visible_to_guest := case
    when new.sender_type = 'guest' then false
    when coalesce(new.staff_display_name, '') = '__staff_only__' then false
    when new.sender_type in ('staff', 'bot')
      and v_locale <> 'cs'
      and (new.body_translated is null or trim(new.body_translated) = '')
      then false
    when new.sender_type in ('staff', 'bot', 'system') then true
    else false
  end;

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
    unread_staff_count = case
      when new.sender_type = 'guest' and v_mode in ('staff', 'waiting')
        then c.unread_staff_count + 1
      else c.unread_staff_count
    end,
    unread_guest_count = case
      when v_visible_to_guest then c.unread_guest_count + 1
      else c.unread_guest_count
    end
  where c.id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_hcc_message_insert on public.hotel_concierge_messages;
create trigger trg_hcc_message_insert
  after insert on public.hotel_concierge_messages
  for each row execute function public.hotel_concierge_on_message_insert();

-- -----------------------------------------------------------------------------
-- 8) Trigger UPDATE body_translated — host dostane unread až po překladu
-- -----------------------------------------------------------------------------
create or replace function public.hotel_concierge_on_message_translated()
returns trigger
language plpgsql
as $$
declare
  v_locale text;
begin
  if new.sender_type not in ('staff', 'bot') then
    return new;
  end if;

  if (old.body_translated is null or trim(old.body_translated) = '')
     and new.body_translated is not null
     and trim(new.body_translated) <> '' then

    select coalesce(c.guest_locale, 'cs') into v_locale
    from public.hotel_concierge_conversations c
    where c.id = new.conversation_id;

    if v_locale <> 'cs' then
      update public.hotel_concierge_conversations c
      set
        unread_guest_count = c.unread_guest_count + 1,
        last_message_preview = left(coalesce(new.body_translated, new.body), 200),
        last_message_at = greatest(c.last_message_at, new.created_at),
        updated_at = now()
      where c.id = new.conversation_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hcc_message_translated on public.hotel_concierge_messages;
create trigger trg_hcc_message_translated
  after update of body_translated on public.hotel_concierge_messages
  for each row execute function public.hotel_concierge_on_message_translated();

-- -----------------------------------------------------------------------------
-- 9) Case summaries (vyřešené chaty → heslovité kartičky)
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_concierge_case_summaries (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_external_id text not null,
  guest_locale text not null default 'cs' check (
    guest_locale in ('cs', 'en', 'de', 'fr', 'pl')
  ),
  summary text not null,
  summary_cs text,
  room_number text,
  resolved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_hccs_guest_resolved
  on public.hotel_concierge_case_summaries (guest_external_id, resolved_at desc);

create index if not exists idx_hccs_hotel_resolved
  on public.hotel_concierge_case_summaries (hotel_id, resolved_at desc);

alter table public.hotel_concierge_case_summaries enable row level security;

drop policy if exists "hccs_guest_read_own" on public.hotel_concierge_case_summaries;
create policy "hccs_guest_read_own" on public.hotel_concierge_case_summaries
  for select to anon, authenticated
  using (
    guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

create or replace function public.get_guest_concierge_case_summaries(
  p_guest_external_id text
)
returns table (
  id uuid,
  summary text,
  summary_cs text,
  guest_locale text,
  room_number text,
  resolved_at timestamptz
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
    s.id,
    s.summary,
    s.summary_cs,
    s.guest_locale,
    s.room_number,
    s.resolved_at
  from public.hotel_concierge_case_summaries s
  where s.guest_external_id = p_guest_external_id
  order by s.resolved_at desc
  limit 50;
end;
$$;

-- -----------------------------------------------------------------------------
-- 10) Realtime RLS pro WebAdmin (staff JWT s claim hotel_id)
-- -----------------------------------------------------------------------------
create or replace function public.concierge_jwt_hotel_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(auth.jwt() ->> 'hotel_id', ''),
    ''
  )::uuid;
$$;

drop policy if exists "hcc_staff_select" on public.hotel_concierge_conversations;
create policy "hcc_staff_select" on public.hotel_concierge_conversations
  for select to authenticated
  using (hotel_id = public.concierge_jwt_hotel_id());

drop policy if exists "hcc_staff_messages_select" on public.hotel_concierge_messages;
create policy "hcc_staff_messages_select" on public.hotel_concierge_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.hotel_id = public.concierge_jwt_hotel_id()
    )
  );

-- -----------------------------------------------------------------------------
-- 11) Grants
-- -----------------------------------------------------------------------------
grant execute on function public.ensure_guest_concierge_conversation(text, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.get_guest_concierge_conversations(text) to anon, authenticated;
grant execute on function public.get_guest_concierge_conversation(uuid, text) to anon, authenticated;
grant execute on function public.get_guest_concierge_messages(uuid, text) to anon, authenticated;
grant execute on function public.send_guest_concierge_message(uuid, text, text, text) to anon, authenticated;
grant execute on function public.mark_concierge_read_by_guest(uuid, text) to anon, authenticated;
grant execute on function public.get_guest_concierge_case_summaries(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 12) Data cleanup / defaults
-- -----------------------------------------------------------------------------
update public.hotel_concierge_conversations
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('mode', 'bot')
where coalesce(metadata->>'mode', '') = ''
  and status = 'open';

update public.hotel_concierge_conversations
set unread_staff_count = 0
where coalesce(metadata->>'mode', 'bot') = 'bot'
  and unread_staff_count > 0;

-- Realtime publication (ignoruj chybu, pokud už je)
do $$
begin
  begin
    alter publication supabase_realtime add table public.hotel_concierge_conversations;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.hotel_concierge_messages;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';

-- Hotovo.
select 'Concierge catch-up OK' as status;
