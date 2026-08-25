-- =============================================================================
-- OtelApps — Recepce (fyzické pokoje, pobyty, folio, minibar, historie)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: public.hotels existuje (slug 'default').
-- =============================================================================

insert into public.hotels (slug, name)
values ('default', 'Grand Hotel Prague')
on conflict (slug) do update set name = excluded.name;

-- ---------------------------------------------------------------------------
-- Inventář pokojů
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_number text not null,
  floor int not null default 0,
  occupancy_status text not null default 'vacant' check (
    occupancy_status in ('vacant', 'occupied', 'ooo')
  ),
  cleaning_status text not null default 'clean' check (
    cleaning_status in ('clean', 'dirty', 'in_progress', 'inspected')
  ),
  cleaning_note text,
  room_type_id uuid references public.hotel_room_types (id) on delete set null,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_rooms_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  unique (hotel_id, room_number)
);

create index if not exists idx_hotel_rooms_hotel_floor
  on public.hotel_rooms (hotel_id, floor, sort_order);
create index if not exists idx_hotel_rooms_hotel_occupancy
  on public.hotel_rooms (hotel_id, occupancy_status);
create index if not exists idx_hotel_rooms_hotel_cleaning
  on public.hotel_rooms (hotel_id, cleaning_status);

-- ---------------------------------------------------------------------------
-- Pobyty
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_stays (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_id uuid not null references public.hotel_rooms (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'checked_out')),
  check_in_at timestamptz not null,
  check_out_at timestamptz not null,
  guest_count int not null default 1 check (guest_count >= 1),
  primary_guest_profile_id uuid references public.hotel_crm_guest_profiles (id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_stays_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hotel_stays_hotel_status
  on public.hotel_stays (hotel_id, status);
create index if not exists idx_hotel_stays_room
  on public.hotel_stays (room_id, status);

-- ---------------------------------------------------------------------------
-- Hosté na pobytu
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_stay_guests (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.hotel_stays (id) on delete cascade,
  guest_profile_id uuid references public.hotel_crm_guest_profiles (id) on delete set null,
  display_name text not null,
  email text,
  phone text,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_stay_guests_stay
  on public.hotel_stay_guests (stay_id, sort_order);

-- ---------------------------------------------------------------------------
-- Požadavky hosta
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_stay_requests (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.hotel_stays (id) on delete cascade,
  label text not null,
  is_checked boolean not null default false,
  is_new boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_stay_requests_stay
  on public.hotel_stay_requests (stay_id, sort_order);

-- ---------------------------------------------------------------------------
-- Folio / faktury
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_folio_lines (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_id uuid not null references public.hotel_rooms (id) on delete cascade,
  stay_id uuid not null references public.hotel_stays (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'CZK',
  category text not null default 'other' check (
    category in ('room', 'minibar', 'service', 'other')
  ),
  posted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hotel_folio_lines_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hotel_folio_lines_stay
  on public.hotel_folio_lines (stay_id, posted_at);
create index if not exists idx_hotel_folio_lines_room
  on public.hotel_folio_lines (room_id, posted_at);

-- ---------------------------------------------------------------------------
-- Minibar katalog + spotřeba
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_minibar_catalog (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  name text not null,
  unit_price numeric(12, 2) not null default 0,
  currency text not null default 'CZK',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_minibar_catalog_hotel
  on public.hotel_minibar_catalog (hotel_id, sort_order);

create table if not exists public.hotel_minibar_charges (
  id uuid primary key default gen_random_uuid(),
  stay_id uuid not null references public.hotel_stays (id) on delete cascade,
  catalog_item_id uuid references public.hotel_minibar_catalog (id) on delete set null,
  name text not null,
  quantity int not null default 1 check (quantity >= 1),
  unit_price numeric(12, 2) not null default 0,
  currency text not null default 'CZK',
  charged_at timestamptz not null default now(),
  folio_line_id uuid references public.hotel_folio_lines (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_minibar_charges_stay
  on public.hotel_minibar_charges (stay_id, charged_at);

-- ---------------------------------------------------------------------------
-- Historie / timeline
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_room_events (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_id uuid not null references public.hotel_rooms (id) on delete cascade,
  stay_id uuid references public.hotel_stays (id) on delete set null,
  event_type text not null default 'note',
  title text not null,
  body text,
  occurred_at timestamptz not null default now(),
  actor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hotel_room_events_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hotel_room_events_room
  on public.hotel_room_events (room_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Závady na pokoji
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_room_issues (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  room_id uuid not null references public.hotel_rooms (id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_hotel_room_issues_room_status
  on public.hotel_room_issues (room_id, status);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.hotel_reception_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hotel_rooms_updated_at on public.hotel_rooms;
create trigger trg_hotel_rooms_updated_at
  before update on public.hotel_rooms
  for each row execute function public.hotel_reception_set_updated_at();

drop trigger if exists trg_hotel_stays_updated_at on public.hotel_stays;
create trigger trg_hotel_stays_updated_at
  before update on public.hotel_stays
  for each row execute function public.hotel_reception_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS (Laravel service role typicky obchází; anon read vypnutý — interní data)
-- ---------------------------------------------------------------------------
alter table public.hotel_rooms enable row level security;
alter table public.hotel_stays enable row level security;
alter table public.hotel_stay_guests enable row level security;
alter table public.hotel_stay_requests enable row level security;
alter table public.hotel_folio_lines enable row level security;
alter table public.hotel_minibar_catalog enable row level security;
alter table public.hotel_minibar_charges enable row level security;
alter table public.hotel_room_events enable row level security;
alter table public.hotel_room_issues enable row level security;

-- ---------------------------------------------------------------------------
-- Demo seed
-- ---------------------------------------------------------------------------
do $$
declare
  v_hotel_id uuid;
  v_room record;
  v_stay_id uuid;
  v_folio_id uuid;
  v_cat_cola uuid;
  v_cat_wine uuid;
  v_cat_nuts uuid;
  v_cat_water uuid;
begin
  select id into v_hotel_id from public.hotels where slug = 'default' limit 1;
  if v_hotel_id is null then
    raise exception 'Hotel with slug default not found';
  end if;

  -- idempotentní seed: smaž existující recepční data hotelu
  delete from public.hotel_minibar_charges
    where stay_id in (select id from public.hotel_stays where hotel_id = v_hotel_id);
  delete from public.hotel_folio_lines where hotel_id = v_hotel_id;
  delete from public.hotel_stay_requests
    where stay_id in (select id from public.hotel_stays where hotel_id = v_hotel_id);
  delete from public.hotel_stay_guests
    where stay_id in (select id from public.hotel_stays where hotel_id = v_hotel_id);
  delete from public.hotel_room_events where hotel_id = v_hotel_id;
  delete from public.hotel_room_issues where hotel_id = v_hotel_id;
  delete from public.hotel_stays where hotel_id = v_hotel_id;
  delete from public.hotel_rooms where hotel_id = v_hotel_id;
  delete from public.hotel_minibar_catalog where hotel_id = v_hotel_id;

  insert into public.hotel_minibar_catalog (hotel_id, name, unit_price, currency, sort_order)
  values
    (v_hotel_id, 'Cola 0,33 l', 85, 'CZK', 1),
    (v_hotel_id, 'Víno červené 0,187 l', 190, 'CZK', 2),
    (v_hotel_id, 'Oříšky 50 g', 120, 'CZK', 3),
    (v_hotel_id, 'Voda neperlivá 0,5 l', 60, 'CZK', 4);

  select id into v_cat_cola from public.hotel_minibar_catalog
    where hotel_id = v_hotel_id and name = 'Cola 0,33 l' limit 1;
  select id into v_cat_wine from public.hotel_minibar_catalog
    where hotel_id = v_hotel_id and name = 'Víno červené 0,187 l' limit 1;
  select id into v_cat_nuts from public.hotel_minibar_catalog
    where hotel_id = v_hotel_id and name = 'Oříšky 50 g' limit 1;
  select id into v_cat_water from public.hotel_minibar_catalog
    where hotel_id = v_hotel_id and name = 'Voda neperlivá 0,5 l' limit 1;

  -- pokoje: přízemí 001–006, 1. patro 101–106, 2. patro 201–206
  insert into public.hotel_rooms (
    hotel_id, room_number, floor, occupancy_status, cleaning_status, cleaning_note, sort_order
  )
  select
    v_hotel_id,
    r.room_number,
    r.floor,
    r.occupancy_status,
    r.cleaning_status,
    r.cleaning_note,
    r.sort_order
  from (values
    -- 2. patro
    ('201', 2, 'occupied', 'clean', null::text, 201),
    ('202', 2, 'occupied', 'clean', null, 202),
    ('203', 2, 'vacant', 'clean', null, 203),
    ('204', 2, 'occupied', 'in_progress', 'Úklid probíhá', 204),
    ('205', 2, 'vacant', 'dirty', 'Po odjezdu', 205),
    ('206', 2, 'ooo', 'dirty', 'Mimo provoz — klimatizace', 206),
    -- 1. patro
    ('101', 1, 'occupied', 'clean', null, 101),
    ('102', 1, 'vacant', 'clean', null, 102),
    ('103', 1, 'occupied', 'inspected', null, 103),
    ('104', 1, 'vacant', 'in_progress', 'Úklid probíhá', 104),
    ('105', 1, 'occupied', 'clean', null, 105),
    ('106', 1, 'vacant', 'dirty', null, 106),
    -- přízemí
    ('001', 0, 'occupied', 'clean', null, 1),
    ('002', 0, 'vacant', 'clean', null, 2),
    ('003', 0, 'occupied', 'dirty', 'Dnes po odjezdu', 3),
    ('004', 0, 'vacant', 'inspected', null, 4),
    ('005', 0, 'occupied', 'clean', null, 5),
    ('214', 2, 'occupied', 'clean', 'Úklid naplánován — dnes po odjezdu', 214)
  ) as r(room_number, floor, occupancy_status, cleaning_status, cleaning_note, sort_order);

  -- závady
  insert into public.hotel_room_issues (hotel_id, room_id, title, body, status)
  select v_hotel_id, rm.id, 'Klimatizace', 'Nefunguje chlazení', 'open'
  from public.hotel_rooms rm where rm.hotel_id = v_hotel_id and rm.room_number = '206';

  insert into public.hotel_room_issues (hotel_id, room_id, title, body, status)
  select v_hotel_id, rm.id, 'Kohoutek', 'Kape voda v koupelně', 'open'
  from public.hotel_rooms rm where rm.hotel_id = v_hotel_id and rm.room_number = '204';

  -- aktivní pobyty
  for v_room in
    select * from (values
      ('214', 'Hruška, Jan', '+420 777 123 456', 'jan.hruska@email.cz', 2,
        '2025-05-18 14:00:00+02'::timestamptz, '2025-05-22 11:00:00+02'::timestamptz, 2450.00),
      ('201', 'Novák, Petr', '+420 602 111 222', 'petr.novak@email.cz', 2,
        '2025-05-17 15:00:00+02'::timestamptz, '2025-05-20 11:00:00+02'::timestamptz, 2100.00),
      ('202', 'Svobodová, Eva', '+420 777 555 666', 'eva.svobodova@email.cz', 1,
        '2025-05-16 14:00:00+02'::timestamptz, '2025-05-19 11:00:00+02'::timestamptz, 1250.00),
      ('204', 'Dvořák, Tomáš', '+420 603 444 555', 'tomas.dvorak@email.cz', 2,
        '2025-05-18 13:00:00+02'::timestamptz, '2025-05-21 11:00:00+02'::timestamptz, 1800.00),
      ('101', 'Král, Martin', '+420 721 333 444', 'martin.kral@email.cz', 1,
        '2025-05-15 16:00:00+02'::timestamptz, '2025-05-18 11:00:00+02'::timestamptz, 980.00),
      ('103', 'Benešová, Lucie', '+420 608 999 111', 'lucie.benesova@email.cz', 3,
        '2025-05-14 14:00:00+02'::timestamptz, '2025-05-20 11:00:00+02'::timestamptz, 4200.00),
      ('105', 'Horák, Jiří', '+420 775 222 333', 'jiri.horak@email.cz', 2,
        '2025-05-17 14:00:00+02'::timestamptz, '2025-05-19 11:00:00+02'::timestamptz, 1500.00),
      ('001', 'Černý, Pavel', '+420 606 777 888', 'pavel.cerny@email.cz', 1,
        '2025-05-18 12:00:00+02'::timestamptz, '2025-05-19 11:00:00+02'::timestamptz, 650.00),
      ('003', 'Procházková, Anna', '+420 702 111 999', 'anna.prochazkova@email.cz', 2,
        '2025-05-16 15:00:00+02'::timestamptz, '2025-05-18 11:00:00+02'::timestamptz, 1100.00),
      ('005', 'Marek, Ondřej', '+420 731 555 000', 'ondrej.marek@email.cz', 1,
        '2025-05-17 14:00:00+02'::timestamptz, '2025-05-22 11:00:00+02'::timestamptz, 3100.00)
    ) as s(room_number, guest_name, phone, email, guest_count, check_in_at, check_out_at, balance)
  loop
    insert into public.hotel_stays (
      hotel_id, room_id, status, check_in_at, check_out_at, guest_count
    )
    select v_hotel_id, rm.id, 'active', v_room.check_in_at, v_room.check_out_at, v_room.guest_count
    from public.hotel_rooms rm
    where rm.hotel_id = v_hotel_id and rm.room_number = v_room.room_number
    returning id into v_stay_id;

    insert into public.hotel_stay_guests (stay_id, display_name, email, phone, is_primary, sort_order)
    values (v_stay_id, v_room.guest_name, v_room.email, v_room.phone, true, 0);

    if v_room.guest_count >= 2 then
      insert into public.hotel_stay_guests (stay_id, display_name, email, phone, is_primary, sort_order)
      values (v_stay_id, 'Doprovod hosta', null, null, false, 1);
    end if;

    if v_room.guest_count >= 3 then
      insert into public.hotel_stay_guests (stay_id, display_name, email, phone, is_primary, sort_order)
      values (v_stay_id, 'Dítě', null, null, false, 2);
    end if;

    -- folio: ubytování jako většina zůstatku
    insert into public.hotel_folio_lines (
      hotel_id, room_id, stay_id, description, amount, currency, category, posted_at
    )
    select
      v_hotel_id, rm.id, v_stay_id,
      'Ubytování',
      greatest(v_room.balance - 200, 100),
      'CZK', 'room', v_room.check_in_at
    from public.hotel_rooms rm
    where rm.hotel_id = v_hotel_id and rm.room_number = v_room.room_number;

    insert into public.hotel_folio_lines (
      hotel_id, room_id, stay_id, description, amount, currency, category, posted_at
    )
    select
      v_hotel_id, rm.id, v_stay_id,
      'City tax',
      least(v_room.balance, 200),
      'CZK', 'other', v_room.check_in_at + interval '1 hour'
    from public.hotel_rooms rm
    where rm.hotel_id = v_hotel_id and rm.room_number = v_room.room_number;

    insert into public.hotel_room_events (
      hotel_id, room_id, stay_id, event_type, title, body, occurred_at, actor_name
    )
    select
      v_hotel_id, rm.id, v_stay_id, 'check_in', 'Check-in',
      'Host ' || v_room.guest_name || ' ubytován.',
      v_room.check_in_at, 'Recepce'
    from public.hotel_rooms rm
    where rm.hotel_id = v_hotel_id and rm.room_number = v_room.room_number;
  end loop;

  -- Požadavky + minibar pro pokoj 214
  select s.id into v_stay_id
  from public.hotel_stays s
  join public.hotel_rooms r on r.id = s.room_id
  where r.hotel_id = v_hotel_id and r.room_number = '214' and s.status = 'active'
  limit 1;

  if v_stay_id is not null then
    insert into public.hotel_stay_requests (stay_id, label, is_checked, is_new, sort_order)
    values
      (v_stay_id, 'Pozdní check-out do 14:00', true, true, 1),
      (v_stay_id, 'Polštář navíc', false, false, 2),
      (v_stay_id, 'Parkovací místo', false, false, 3);

    insert into public.hotel_folio_lines (
      hotel_id, room_id, stay_id, description, amount, currency, category, posted_at
    )
    select v_hotel_id, s.room_id, v_stay_id, 'Minibar — Cola 0,33 l', 85, 'CZK', 'minibar', now() - interval '1 day'
    from public.hotel_stays s where s.id = v_stay_id
    returning id into v_folio_id;

    insert into public.hotel_minibar_charges (
      stay_id, catalog_item_id, name, quantity, unit_price, currency, charged_at, folio_line_id
    ) values (
      v_stay_id, v_cat_cola, 'Cola 0,33 l', 1, 85, 'CZK', now() - interval '1 day', v_folio_id
    );

    insert into public.hotel_folio_lines (
      hotel_id, room_id, stay_id, description, amount, currency, category, posted_at
    )
    select v_hotel_id, s.room_id, v_stay_id, 'Minibar — Víno červené 0,187 l', 190, 'CZK', 'minibar', now() - interval '6 hours'
    from public.hotel_stays s where s.id = v_stay_id
    returning id into v_folio_id;

    insert into public.hotel_minibar_charges (
      stay_id, catalog_item_id, name, quantity, unit_price, currency, charged_at, folio_line_id
    ) values (
      v_stay_id, v_cat_wine, 'Víno červené 0,187 l', 1, 190, 'CZK', now() - interval '6 hours', v_folio_id
    );

    insert into public.hotel_room_events (
      hotel_id, room_id, stay_id, event_type, title, body, occurred_at, actor_name
    )
    select v_hotel_id, s.room_id, v_stay_id, 'request', 'Požadavek hosta',
      'Pozdní check-out do 14:00', now() - interval '2 hours', 'Recepce'
    from public.hotel_stays s where s.id = v_stay_id;

    insert into public.hotel_room_events (
      hotel_id, room_id, stay_id, event_type, title, body, occurred_at, actor_name
    )
    select v_hotel_id, s.room_id, v_stay_id, 'minibar', 'Minibar',
      'Naúčtováno víno červené', now() - interval '6 hours', 'Pokojová služba'
    from public.hotel_stays s where s.id = v_stay_id;
  end if;

  -- historie pro volný pokoj 203
  insert into public.hotel_room_events (
    hotel_id, room_id, stay_id, event_type, title, body, occurred_at, actor_name
  )
  select v_hotel_id, rm.id, null, 'cleaning', 'Úklid dokončen',
    'Pokoj připraven k ubytování.', now() - interval '3 hours', 'Housekeeping'
  from public.hotel_rooms rm
  where rm.hotel_id = v_hotel_id and rm.room_number = '203';

end;
$$;
