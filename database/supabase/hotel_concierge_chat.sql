-- =============================================================================
-- OtelApps — Concierge (chat host ↔ recepce)
-- Spusť v Supabase: SQL Editor → New query → Run
-- Předpoklad: tabulka public.hotels už existuje.
--
-- WebAdmin: Laravel API /api/concierge/* (service role / bypass RLS)
-- Mobilní app: Supabase client + JWT (guest_external_id = jwt.sub)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Konverzace
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_concierge_conversations (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_external_id text,
  guest_display_name text not null,
  room_number text,
  guest_locale text not null default 'cs' check (
    guest_locale in ('cs', 'en', 'de', 'fr', 'pl')
  ),
  status text not null default 'open' check (
    status in ('open', 'closed', 'archived')
  ),
  last_message_preview text,
  last_message_at timestamptz,
  unread_staff_count int not null default 0 check (unread_staff_count >= 0),
  unread_guest_count int not null default 0 check (unread_guest_count >= 0),
  assigned_staff_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_concierge_conversations_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.hotel_concierge_conversations is
  'Konverzace host–recepce z mobilní aplikace (Concierge chat).';
comment on column public.hotel_concierge_conversations.guest_locale is
  'Preferovaný jazyk hosta: cs | en | de | fr | pl — pro budoucí překlad odpovědí personálu.';
comment on column public.hotel_concierge_conversations.unread_staff_count is
  'Počet zpráv od hosta, které recepce ještě nečetla.';
comment on column public.hotel_concierge_conversations.unread_guest_count is
  'Počet zpráv od recepce/bota, které host ještě nečetl.';

-- -----------------------------------------------------------------------------
-- Zprávy
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_concierge_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.hotel_concierge_conversations (id) on delete cascade,
  sender_type text not null check (
    sender_type in ('guest', 'staff', 'bot', 'system')
  ),
  body text not null,
  body_original text,
  body_translated text,
  locale text check (locale is null or locale in ('cs', 'en', 'de', 'fr', 'pl')),
  staff_display_name text,
  read_by_staff_at timestamptz,
  read_by_guest_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.hotel_concierge_messages is
  'Zprávy v konverzaci. body_translated se doplní chatbotem (překlad staff → jazyk hosta).';
comment on column public.hotel_concierge_messages.body_original is
  'Původní text personálu (obvykle česky) před strojovým překladem.';
comment on column public.hotel_concierge_messages.body_translated is
  'Text zobrazený hostovi v jeho jazyce (guest_locale konverzace).';

-- -----------------------------------------------------------------------------
-- Indexy
-- -----------------------------------------------------------------------------
create index if not exists idx_hcc_hotel_last_message
  on public.hotel_concierge_conversations (hotel_id, last_message_at desc nulls last);
create index if not exists idx_hcc_hotel_unread
  on public.hotel_concierge_conversations (hotel_id, unread_staff_count desc)
  where unread_staff_count > 0;
create index if not exists idx_hcc_hotel_unread_guest
  on public.hotel_concierge_conversations (hotel_id, unread_guest_count desc)
  where unread_guest_count > 0;
create index if not exists idx_hcc_guest_external
  on public.hotel_concierge_conversations (hotel_id, guest_external_id)
  where guest_external_id is not null;
create unique index if not exists idx_hcc_one_conversation_per_guest
  on public.hotel_concierge_conversations (hotel_id, guest_external_id)
  where guest_external_id is not null;
create index if not exists idx_hccm_conversation_created
  on public.hotel_concierge_messages (conversation_id, created_at asc);

-- -----------------------------------------------------------------------------
-- Triggery
-- -----------------------------------------------------------------------------
create or replace function public.hotel_concierge_on_message_insert()
returns trigger
language plpgsql
as $$
begin
  update public.hotel_concierge_conversations c
  set
    last_message_preview = left(
      case
        when new.sender_type in ('staff', 'bot') then coalesce(new.body_translated, new.body)
        else new.body
      end,
      200
    ),
    last_message_at = new.created_at,
    updated_at = now(),
    unread_staff_count = case
      when new.sender_type = 'guest' then c.unread_staff_count + 1
      else c.unread_staff_count
    end,
    unread_guest_count = case
      when new.sender_type in ('staff', 'bot') then c.unread_guest_count + 1
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

create or replace function public.hotel_concierge_conversations_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_hcc_updated_at on public.hotel_concierge_conversations;
create trigger trg_hcc_updated_at
  before update on public.hotel_concierge_conversations
  for each row execute function public.hotel_concierge_conversations_set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — mobilní app (JWT sub = guest_external_id)
-- -----------------------------------------------------------------------------
alter table public.hotel_concierge_conversations enable row level security;
alter table public.hotel_concierge_messages enable row level security;

drop policy if exists "hcc_guest_read_own" on public.hotel_concierge_conversations;
create policy "hcc_guest_read_own" on public.hotel_concierge_conversations
  for select to anon, authenticated
  using (
    guest_external_id is not null
    and guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

drop policy if exists "hcc_guest_insert" on public.hotel_concierge_conversations;
create policy "hcc_guest_insert" on public.hotel_concierge_conversations
  for insert to anon, authenticated
  with check (
    guest_external_id is not null
    and guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

drop policy if exists "hcc_guest_update_own" on public.hotel_concierge_conversations;
create policy "hcc_guest_update_own" on public.hotel_concierge_conversations
  for update to anon, authenticated
  using (
    guest_external_id is not null
    and guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  )
  with check (
    guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

drop policy if exists "hcc_guest_messages" on public.hotel_concierge_messages;
drop policy if exists "hcc_guest_messages_select" on public.hotel_concierge_messages;
drop policy if exists "hcc_guest_messages_insert" on public.hotel_concierge_messages;
drop policy if exists "hcc_guest_messages_update" on public.hotel_concierge_messages;

create policy "hcc_guest_messages_select" on public.hotel_concierge_messages
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    )
  );

create policy "hcc_guest_messages_insert" on public.hotel_concierge_messages
  for insert to anon, authenticated
  with check (
    sender_type = 'guest'
    and exists (
      select 1 from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
        and c.status = 'open'
    )
  );

create policy "hcc_guest_messages_update" on public.hotel_concierge_messages
  for update to anon, authenticated
  using (
    exists (
      select 1 from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    )
  )
  with check (
    exists (
      select 1 from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
    )
  );

-- -----------------------------------------------------------------------------
-- Pohled pro mobil — text zobrazený hostovi
-- -----------------------------------------------------------------------------
create or replace view public.v_hotel_concierge_messages_guest as
select
  m.id,
  m.conversation_id,
  m.sender_type,
  case
    when m.sender_type in ('staff', 'bot') then coalesce(m.body_translated, m.body)
    else m.body
  end as display_body,
  m.body,
  m.body_translated,
  m.locale,
  m.staff_display_name,
  m.read_by_guest_at,
  m.created_at
from public.hotel_concierge_messages m;

grant select on public.v_hotel_concierge_messages_guest to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Seed ukázkových konverzací (WebAdmin demo)
-- -----------------------------------------------------------------------------
with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_concierge_conversations (
  hotel_id, guest_external_id, guest_display_name, room_number, guest_locale,
  status, created_at, updated_at
)
select
  h.id, v.guest_external_id, v.guest_name, v.room, v.locale,
  v.status, v.created_at, v.updated_at
from h
cross join (
  values
    ('guest-marc-201', 'Marc Dubois', '201', 'fr', 'open', now() - interval '2 days', now()),
    ('guest-sara-522', 'Sara', '522', 'en', 'open', now() - interval '1 day', now()),
    ('guest-james-118', 'James Miller', '118', 'de', 'open', now() - interval '3 days', now()),
    ('guest-elena-304', 'Elena Rossi', '304', 'pl', 'closed', now() - interval '5 days', now()),
    ('guest-anna-415', 'Anna K.', '415', 'cs', 'open', now() - interval '6 hours', now())
) as v(guest_external_id, guest_name, room, locale, status, created_at, updated_at)
where not exists (
  select 1 from public.hotel_concierge_conversations c
  where c.guest_external_id = v.guest_external_id
);

insert into public.hotel_concierge_messages (conversation_id, sender_type, body, locale, created_at)
select c.id, m.sender, m.body, m.locale, m.created_at
from public.hotel_concierge_conversations c
join (
  values
    ('guest-marc-201', 'guest', 'Bonjour, une question sur le spa.', 'fr', now() - interval '2 hours'),
    ('guest-marc-201', 'staff', 'Bonjour, le spa est ouvert de 9h à 21h.', 'fr', now() - interval '1 hour 50 minutes'),
    ('guest-marc-201', 'guest', 'Pourriez-vous réserver une table pour deux ce soir ?', 'fr', now() - interval '15 minutes'),
    ('guest-sara-522', 'guest', 'Is the pool open until 10 p.m.?', 'en', now() - interval '1 hour'),
    ('guest-james-118', 'guest', 'Können Sie mir extra Handtücher schicken?', 'de', now() - interval '3 hours'),
    ('guest-james-118', 'staff', 'Selbstverständlich, wir senden Handtücher sofort.', 'de', now() - interval '2 hours 45 minutes'),
    ('guest-elena-304', 'guest', 'Dziękuję za pomoc!', 'pl', now() - interval '1 day'),
    ('guest-elena-304', 'staff', 'Proszę bardzo, miłego pobytu!', 'pl', now() - interval '23 hours'),
    ('guest-anna-415', 'guest', 'Dobrý den, prosím o pozdní checkout zítra.', 'cs', now() - interval '30 minutes')
) as m(guest_ext, sender, body, locale, created_at) on c.guest_external_id = m.guest_ext
where not exists (
  select 1 from public.hotel_concierge_messages msg where msg.conversation_id = c.id
);

-- =============================================================================
-- Kontrakt pro mobilní app (Supabase)
-- =============================================================================
--
-- 1) JWT: guest_external_id MUSÍ být stejné jako auth.uid() / jwt.sub
--
-- 2) Zahájení / obnovení konverzace (upsert):
--    insert into hotel_concierge_conversations (
--      hotel_id, guest_external_id, guest_display_name, room_number, guest_locale
--    ) values (...)
--    on conflict (hotel_id, guest_external_id) where guest_external_id is not null
--    do update set guest_display_name = excluded.guest_display_name,
--                  room_number = excluded.room_number,
--                  guest_locale = excluded.guest_locale;
--    (nebo nejdřív select podle hotel_id + guest_external_id)
--
-- 3) Odeslání zprávy hosta:
--    insert into hotel_concierge_messages (
--      conversation_id, sender_type, body, locale
--    ) values (..., 'guest', 'text', 'en');
--
-- 4) Načtení vlákna pro hosta:
--    select * from v_hotel_concierge_messages_guest
--    where conversation_id = :id order by created_at;
--
-- 5) Označení jako přečtené (host):
--    update hotel_concierge_messages set read_by_guest_at = now()
--      where conversation_id = :id and sender_type in ('staff','bot') and read_by_guest_at is null;
--    update hotel_concierge_conversations set unread_guest_count = 0 where id = :id;
--
-- 6) WebAdmin (recepce) — Laravel API pro zápis + Supabase Realtime pro live obnovu:
--    GET  /api/concierge/realtime-config   (staff JWT + publishable key)
--    GET  /api/concierge/conversations
--    GET  /api/concierge/conversations/{id}
--    POST /api/concierge/conversations/{id}/messages  { body, staff_display_name? }
--    POST /api/concierge/conversations/{id}/read
--    Realtime: spusť hotel_concierge_realtime_staff.sql + SUPABASE_JWT_SECRET v .env
--
-- 7) Staff odpověď — ukládat:
--    body = český text personálu
--    body_original = stejný text
--    body_translated = NULL (doplní chatbot) nebo překlad do guest_locale
--    sender_type = 'staff'
--    Host v appce vidí coalesce(body_translated, body)
--
-- 8) guest_locale: cs | en | de | fr | pl
-- =============================================================================
