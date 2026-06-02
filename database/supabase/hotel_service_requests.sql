-- =============================================================================
-- OtelApps — Activity → Requests (tiketovací systém / guest service requests)
-- Spusť v Supabase: SQL Editor → New query → Run
-- Předpoklad: tabulka public.hotels už existuje.
--
-- Tok:
--   1) Mobilní app vytvoří řádek v hotel_service_requests (+ položky v metadata)
--   2) WebAdmin (Activity) načte seznam, filtruje, mění status / poznámky
--   3) Historie změn statusu v hotel_service_request_status_logs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Číselník typů služeb
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_service_request_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  module_key text not null,
  label text not null,
  icon_name text not null default 'help',
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (hotel_id, module_key)
);

comment on table public.hotel_service_request_types is
  'Mapování modulu aplikace (amenities, restaurants_bars, …) na zobrazení v Activity tabulce.';
comment on column public.hotel_service_request_types.module_key is
  'Klíč služby — stejný jako v config/modules.php (např. amenities, room_service).';
comment on column public.hotel_service_request_types.icon_name is
  'Material Symbols název (např. bed, restaurant, fitness_center).';

-- -----------------------------------------------------------------------------
-- Hlavní tiket / požadavek hosta
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_service_requests (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  request_number text,
  service_module text not null,
  service_label text not null,
  service_icon text not null default 'help',
  request_text text not null,
  guest_display_name text not null,
  room_number text not null,
  guest_phone text,
  guest_email text,
  guest_locale text default 'cs',
  guest_external_id text,
  device_id text,
  app_session_id text,
  status text not null default 'new' check (
    status in ('new', 'pending', 'in_progress', 'solved', 'rejected', 'archived')
  ),
  status_guest_note text,
  staff_note text,
  priority smallint not null default 0 check (priority between 0 and 3),
  assigned_staff_name text,
  metadata jsonb not null default '{}'::jsonb,
  source_entity_type text,
  source_entity_slug text,
  created_via text not null default 'mobile_app' check (
    created_via in ('mobile_app', 'web_admin', 'api', 'system')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  solved_at timestamptz,
  constraint hotel_service_requests_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.hotel_service_requests is
  'Požadavky hostů z mobilní aplikace — zobrazení a editace v Activity → Requests.';
comment on column public.hotel_service_requests.status is
  'new | pending | in_progress | solved | rejected | archived';
comment on column public.hotel_service_requests.status_guest_note is
  'Poznámka od hosta (komentář z potvrzovací obrazovky v appce).';
comment on column public.hotel_service_requests.metadata is
  'JSON dle typu služby — viz dokumentace na konci souboru.';

-- -----------------------------------------------------------------------------
-- Historie změn statusu
-- -----------------------------------------------------------------------------
create table if not exists public.hotel_service_request_status_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hotel_service_requests (id) on delete cascade,
  from_status text check (
    from_status is null or from_status in ('new', 'pending', 'in_progress', 'solved', 'rejected', 'archived')
  ),
  to_status text not null check (
    to_status in ('new', 'pending', 'in_progress', 'solved', 'rejected', 'archived')
  ),
  note text,
  changed_by text not null default 'system',
  created_at timestamptz not null default now()
);

comment on table public.hotel_service_request_status_logs is
  'Každá změna statusu z web adminu nebo automatiky — pro timeline a mobilní notifikace.';

-- -----------------------------------------------------------------------------
-- Indexy
-- -----------------------------------------------------------------------------
create index if not exists idx_hsr_hotel_created
  on public.hotel_service_requests (hotel_id, created_at desc);
create index if not exists idx_hsr_hotel_status_created
  on public.hotel_service_requests (hotel_id, status, created_at desc);
create index if not exists idx_hsr_hotel_service_module
  on public.hotel_service_requests (hotel_id, service_module);
create index if not exists idx_hsr_hotel_room
  on public.hotel_service_requests (hotel_id, room_number);
create index if not exists idx_hsr_guest_external
  on public.hotel_service_requests (hotel_id, guest_external_id)
  where guest_external_id is not null;
create index if not exists idx_hsr_status_logs_request
  on public.hotel_service_request_status_logs (request_id, created_at desc);
create unique index if not exists idx_hsr_request_number_per_hotel
  on public.hotel_service_requests (hotel_id, request_number)
  where request_number is not null;

-- -----------------------------------------------------------------------------
-- Triggery: updated_at, request_number, audit log
-- -----------------------------------------------------------------------------
create or replace function public.hotel_service_requests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = 'solved' and new.solved_at is null then
    new.solved_at := now();
  end if;
  if new.status = 'archived' and new.archived_at is null then
    new.archived_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_service_requests_updated_at on public.hotel_service_requests;
create trigger trg_hotel_service_requests_updated_at
  before update on public.hotel_service_requests
  for each row execute function public.hotel_service_requests_set_updated_at();

create or replace function public.hotel_service_requests_assign_number()
returns trigger
language plpgsql
as $$
declare
  seq int;
  yr text;
begin
  if new.request_number is not null then
    return new;
  end if;
  yr := to_char(now(), 'YYYY');
  select count(*) + 1 into seq
  from public.hotel_service_requests
  where hotel_id = new.hotel_id
    and created_at >= date_trunc('year', now());
  new.request_number := 'REQ-' || yr || '-' || lpad(seq::text, 5, '0');
  return new;
end;
$$;

drop trigger if exists trg_hotel_service_requests_number on public.hotel_service_requests;
create trigger trg_hotel_service_requests_number
  before insert on public.hotel_service_requests
  for each row execute function public.hotel_service_requests_assign_number();

create or replace function public.hotel_service_request_log_status_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.hotel_service_request_status_logs (request_id, from_status, to_status, note, changed_by)
    values (new.id, null, new.status, new.status_guest_note, 'insert');
    return new;
  end if;
  if old.status is distinct from new.status then
    insert into public.hotel_service_request_status_logs (request_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status, coalesce(new.staff_note, new.status_guest_note), 'update');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_service_request_status_log on public.hotel_service_requests;
create trigger trg_hotel_service_request_status_log
  after insert or update of status on public.hotel_service_requests
  for each row execute function public.hotel_service_request_log_status_change();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.hotel_service_request_types enable row level security;
alter table public.hotel_service_requests enable row level security;
alter table public.hotel_service_request_status_logs enable row level security;

drop policy if exists "hsr_types_public_read" on public.hotel_service_request_types;
create policy "hsr_types_public_read" on public.hotel_service_request_types
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "hsr_guest_read_own" on public.hotel_service_requests;
create policy "hsr_guest_read_own" on public.hotel_service_requests
  for select to anon, authenticated
  using (
    guest_external_id is not null
    and guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

drop policy if exists "hsr_guest_insert" on public.hotel_service_requests;
create policy "hsr_guest_insert" on public.hotel_service_requests
  for insert to anon, authenticated
  with check (created_via = 'mobile_app');

drop policy if exists "hsr_status_logs_read" on public.hotel_service_request_status_logs;
create policy "hsr_status_logs_read" on public.hotel_service_request_status_logs
  for select to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Seed: hotel + typy služeb
-- -----------------------------------------------------------------------------
insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_service_request_types (hotel_id, module_key, label, icon_name, sort_order)
select h.id, v.module_key, v.label, v.icon_name, v.sort_order
from h
cross join (
  values
    ('restaurants_bars', 'Restaurants', 'restaurant', 10),
    ('amenities', 'Amenities', 'bed', 20),
    ('room_service', 'Room service', 'room_service', 30),
    ('laundry', 'Housekeeping', 'cleaning_services', 40),
    ('issues_repairs', 'Maintenance', 'build', 50),
    ('relax_sport', 'Sports', 'fitness_center', 60),
    ('wellness_spa', 'Wellness', 'spa', 70),
    ('parking', 'Parking', 'local_parking', 80),
    ('concierge', 'Concierge', 'support_agent', 90)
) as v(module_key, label, icon_name, sort_order)
on conflict (hotel_id, module_key) do update set
  label = excluded.label,
  icon_name = excluded.icon_name,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Seed: ukázkové tikety pro Activity (jen pokud ještě neexistují)
-- -----------------------------------------------------------------------------
with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_service_requests (
  hotel_id,
  service_module,
  service_label,
  service_icon,
  request_text,
  guest_display_name,
  room_number,
  status,
  status_guest_note,
  guest_external_id,
  metadata,
  created_via,
  created_at,
  updated_at
)
select
  h.id,
  v.service_module,
  v.service_label,
  v.service_icon,
  v.request_text,
  v.guest_name,
  v.room_number,
  v.status,
  v.status_guest_note,
  v.guest_external_id,
  v.metadata::jsonb,
  'mobile_app',
  v.created_at,
  v.updated_at
from h
cross join (
  values
    (
      'room_service', 'Room service', 'room_service',
      'Snídaně na pokoj', 'Jan Novák', '101', 'solved', null,
      'guest-jan-101-rs', '{"menu_slug":"snidane","total_amount":450,"items":[{"slug":"croissant","name":"Croissant","quantity":2,"unit_price":125}]}',
      now() - interval '3 hours', now() - interval '2 hours'
    ),
    (
      'relax_sport', 'Sports', 'fitness_center',
      'Snorkeling underwater', 'Sara', '522', 'new', 'Message from guest',
      'guest-sara-522', '{}',
      now() - interval '2 hours', now() - interval '1 hour'
    ),
    (
      'amenities', 'Amenities', 'bed',
      'Shaving Kit', 'James Miller', '118', 'solved', null,
      'guest-james-118', '{"items":[{"slug":"holici-sada","name":"Holící sada","quantity":1,"unit_price":89}]}',
      now() - interval '1 day', now() - interval '12 hours'
    ),
    (
      'laundry', 'Housekeeping', 'cleaning_services',
      'Poolside cabana — 16:00', 'Elena Rossi', '304', 'in_progress', null,
      'guest-elena-304', '{"items":[{"slug":"cabana","name":"Poolside cabana","quantity":1,"category_slug":"extra"}],"scheduled_at":"2026-05-31T16:00:00+02:00"}',
      now() - interval '2 days', now() - interval '1 day'
    ),
    (
      'restaurants_bars', 'Restaurants', 'restaurant',
      'Dinner reservation — 8 p.m.', 'Marc Dubois', '201', 'new', null,
      'guest-marc-201', '{"venue_slug":"hotel-restaurant","party_size":2,"scheduled_at":"2026-05-31T20:00:00+02:00"}',
      now() - interval '3 days', now() - interval '3 days'
    ),
    (
      'relax_sport', 'Sports', 'fitness_center',
      'Tennis court — 1 hour', 'Anna K.', '415', 'pending', 'Message from guest',
      'guest-anna-415', '{"duration_minutes":60}',
      now() - interval '4 days', now() - interval '4 days'
    )
) as v(
  service_module, service_label, service_icon,
  request_text, guest_name, room_number, status, status_guest_note,
  guest_external_id, metadata, created_at, updated_at
)
where not exists (
  select 1
  from public.hotel_service_requests r
  where r.guest_external_id = v.guest_external_id
);

-- -----------------------------------------------------------------------------
-- Pohled pro admin API
-- -----------------------------------------------------------------------------
create or replace view public.v_hotel_service_requests_list as
select
  r.id,
  r.hotel_id,
  r.request_number,
  r.service_module,
  r.service_label,
  r.service_icon,
  r.request_text,
  r.guest_display_name,
  r.room_number,
  r.status,
  r.status_guest_note,
  r.staff_note,
  r.priority,
  r.assigned_staff_name,
  r.metadata,
  r.created_via,
  r.created_at,
  r.updated_at,
  r.solved_at,
  r.archived_at
from public.hotel_service_requests r;

grant select on public.v_hotel_service_requests_list to anon, authenticated;

-- =============================================================================
-- Kontrakt metadata (mobilní app OtelApps)
-- =============================================================================
--
-- amenities (Doplňky):
--   { "items": [{ "slug", "name", "quantity" }] }
--
-- laundry (Úklid pokoje):
--   { "items": [{ "slug", "name", "quantity", "category_slug" }] }
--
-- issues_repairs (Údržba):
--   { "category_slug", "item_slug", "item_label" }
--
-- room_service (Snídaně / Oběd / Večeře):
--   {
--     "menu_slug": "snidane|obed|vecere",
--     "total_amount": 299.8,
--     "items": [{ "slug", "name", "quantity", "unit_price", "options" }]
--   }
--
-- restaurants_bars:
--   { "venue_slug", "party_size", "scheduled_at" }
--
-- relax_sport / wellness_spa:
--   { "facility_slug", "scheduled_at", "duration_minutes" }
--
-- Mobil ukládá komentář hosta do sloupce status_guest_note.
-- service_label + service_icon se berou z hotel_service_request_types.
-- =============================================================================
