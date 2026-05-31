-- =============================================================================
-- OtelApps — Úklid pokoje (Služby hotelu → Požadavky → Úklid pokoje)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: tabulka public.hotels už existuje (migrace restaurací).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabulky
-- -----------------------------------------------------------------------------

create table if not exists public.hotel_housekeeping (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null default 'uklid-pokoje',
  title text not null default 'Úklid pokoje',
  description text not null,
  schedule_summary text,
  header_image_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, slug)
);

create table if not exists public.hotel_housekeeping_hours (
  id uuid primary key default gen_random_uuid(),
  housekeeping_id uuid not null references public.hotel_housekeeping (id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  day_name text not null,
  hours_text text not null,
  unique (housekeeping_id, day_order)
);

create table if not exists public.hotel_housekeeping_categories (
  id uuid primary key default gen_random_uuid(),
  housekeeping_id uuid not null references public.hotel_housekeeping (id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  unique (housekeeping_id, slug)
);

create table if not exists public.hotel_housekeeping_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.hotel_housekeeping_categories (id) on delete cascade,
  slug text not null,
  title text not null,
  icon_image_key text,
  sort_order int not null default 0,
  is_available boolean not null default true,
  unique (category_id, slug)
);

create index if not exists idx_hotel_housekeeping_hotel on public.hotel_housekeeping (hotel_id);
create index if not exists idx_hotel_housekeeping_hours_housekeeping on public.hotel_housekeeping_hours (housekeeping_id);
create index if not exists idx_hotel_housekeeping_categories_housekeeping on public.hotel_housekeeping_categories (housekeeping_id);
create index if not exists idx_hotel_housekeeping_items_category on public.hotel_housekeeping_items (category_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.hotel_housekeeping enable row level security;
alter table public.hotel_housekeeping_hours enable row level security;
alter table public.hotel_housekeeping_categories enable row level security;
alter table public.hotel_housekeeping_items enable row level security;

create policy "hotel_housekeeping_public_read"
  on public.hotel_housekeeping for select
  to anon, authenticated
  using (is_active = true);

create policy "hotel_housekeeping_hours_public_read"
  on public.hotel_housekeeping_hours for select
  to anon, authenticated
  using (true);

create policy "hotel_housekeeping_categories_public_read"
  on public.hotel_housekeeping_categories for select
  to anon, authenticated
  using (true);

create policy "hotel_housekeeping_items_public_read"
  on public.hotel_housekeeping_items for select
  to anon, authenticated
  using (is_available = true);

-- -----------------------------------------------------------------------------
-- Seed: data z aplikace (UklidScreen)
-- -----------------------------------------------------------------------------

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_housekeeping (
  hotel_id, slug, title, description, schedule_summary, header_image_key
)
select
  h.id,
  'uklid-pokoje',
  'Úklid pokoje',
  E'Využijte naši pokojovou službu a objednejte si občerstvení, nápoje nebo další služby přímo na svůj pokoj.\n\nStačí si vybrat z nabídky a o vše ostatní se postaráme, abyste si mohli užívat maximální pohodlí a komfort.',
  '06:00 - 20:00',
  'headerMaintenance'
from h
on conflict (hotel_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  schedule_summary = excluded.schedule_summary,
  header_image_key = excluded.header_image_key;

insert into public.hotel_housekeeping_hours (housekeeping_id, day_order, day_name, hours_text)
select hk.id, d.day_order, d.day_name, d.hours_text
from public.hotel_housekeeping hk
cross join (
  values
    (1, 'Pondělí', '06:00 - 20:00'),
    (2, 'Úterý', '06:00 - 20:00'),
    (3, 'Středa', '06:00 - 20:00'),
    (4, 'Čtvrtek', '06:00 - 20:00'),
    (5, 'Pátek', '06:00 - 20:00'),
    (6, 'Sobota', '06:00 - 20:00'),
    (7, 'Neděle', '06:00 - 20:00')
) as d (day_order, day_name, hours_text)
where hk.slug = 'uklid-pokoje'
on conflict (housekeeping_id, day_order) do update set hours_text = excluded.hours_text;

insert into public.hotel_housekeeping_categories (housekeeping_id, slug, title, sort_order)
select hk.id, 'pokoj', 'Pokoj', 1
from public.hotel_housekeeping hk
where hk.slug = 'uklid-pokoje'
on conflict (housekeeping_id, slug) do update set title = excluded.title;

insert into public.hotel_housekeeping_items (category_id, slug, title, icon_image_key, sort_order)
select cat.id, i.slug, i.title, i.icon_image_key, i.sort_order
from public.hotel_housekeeping_categories cat
join public.hotel_housekeeping hk on hk.id = cat.housekeeping_id
cross join (
  values
    ('pokojova-sluzba', 'Pokojová služba', 'roomServiceIcon', 1),
    ('ztraty-nalezy', 'Ztráty a nálezy', 'lostFoundIcon', 2)
) as i (slug, title, icon_image_key, sort_order)
where hk.slug = 'uklid-pokoje' and cat.slug = 'pokoj'
on conflict (category_id, slug) do update set
  title = excluded.title,
  icon_image_key = excluded.icon_image_key,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Pohled pro appku
-- -----------------------------------------------------------------------------

create or replace view public.hotel_housekeeping_export as
select
  hk.slug as housekeeping_slug,
  hk.title,
  hk.description,
  hk.schedule_summary,
  hk.header_image_key,
  coalesce(
    (
      select json_agg(
        json_build_object(
          'day_order', h.day_order,
          'day_name', h.day_name,
          'hours_text', h.hours_text
        )
        order by h.day_order
      )
      from public.hotel_housekeeping_hours h
      where h.housekeeping_id = hk.id
    ),
    '[]'::json
  ) as opening_hours,
  coalesce(
    (
      select json_agg(
        json_build_object(
          'slug', cat.slug,
          'title', cat.title,
          'sort_order', cat.sort_order,
          'items', (
            select coalesce(
              json_agg(
                json_build_object(
                  'slug', i.slug,
                  'title', i.title,
                  'icon_image_key', i.icon_image_key,
                  'sort_order', i.sort_order
                )
                order by i.sort_order
              ),
              '[]'::json
            )
            from public.hotel_housekeeping_items i
            where i.category_id = cat.id and i.is_available
          )
        )
        order by cat.sort_order
      )
      from public.hotel_housekeeping_categories cat
      where cat.housekeeping_id = hk.id
    ),
    '[]'::json
  ) as categories
from public.hotel_housekeeping hk
where hk.is_active;

grant select on public.hotel_housekeeping_export to anon, authenticated;
