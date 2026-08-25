-- =============================================================================
-- OtelApps — Doplňky a toaletní potřeby (Services → Amenities)
-- Spusť v Supabase: SQL Editor → Run
-- =============================================================================

create table if not exists public.hotel_supplies (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null default 'doplnky',
  title text not null default 'Doplňky',
  description text not null,
  schedule_summary text,
  header_image_key text,
  max_quantity_per_item smallint not null default 3 check (max_quantity_per_item between 1 and 99),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, slug)
);

create table if not exists public.hotel_supplies_hours (
  id uuid primary key default gen_random_uuid(),
  supplies_id uuid not null references public.hotel_supplies (id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  day_name text not null,
  hours_text text not null,
  unique (supplies_id, day_order)
);

create table if not exists public.hotel_supplies_categories (
  id uuid primary key default gen_random_uuid(),
  supplies_id uuid not null references public.hotel_supplies (id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  unique (supplies_id, slug)
);

create table if not exists public.hotel_supplies_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.hotel_supplies_categories (id) on delete cascade,
  slug text not null,
  name text not null,
  icon_emoji text,
  sort_order int not null default 0,
  is_available boolean not null default true,
  unique (category_id, slug)
);

create index if not exists idx_hotel_supplies_hotel on public.hotel_supplies (hotel_id);
create index if not exists idx_hotel_supplies_hours_supplies on public.hotel_supplies_hours (supplies_id);
create index if not exists idx_hotel_supplies_categories_supplies on public.hotel_supplies_categories (supplies_id);
create index if not exists idx_hotel_supplies_items_category on public.hotel_supplies_items (category_id);

alter table public.hotel_supplies enable row level security;
alter table public.hotel_supplies_hours enable row level security;
alter table public.hotel_supplies_categories enable row level security;
alter table public.hotel_supplies_items enable row level security;

create policy "hotel_supplies_public_read"
  on public.hotel_supplies for select to anon, authenticated using (is_active = true);

create policy "hotel_supplies_hours_public_read"
  on public.hotel_supplies_hours for select to anon, authenticated using (true);

create policy "hotel_supplies_categories_public_read"
  on public.hotel_supplies_categories for select to anon, authenticated using (true);

create policy "hotel_supplies_items_public_read"
  on public.hotel_supplies_items for select to anon, authenticated using (is_available = true);

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_supplies (
  hotel_id, slug, title, description, schedule_summary, header_image_key, max_quantity_per_item
)
select h.id, 'doplnky', 'Doplňky',
  'Vyberte si z řady produktů a doplňků, které jste náhodou zapomněli nebo vám schází. My jej vám nasáledně obratel přineseme až ke dveřím.',
  '06:00 - 20:00', 'headerDoplnky', 3
from h
on conflict (hotel_id, slug) do update set
  title = excluded.title,
  description = excluded.description,
  schedule_summary = excluded.schedule_summary,
  header_image_key = excluded.header_image_key,
  max_quantity_per_item = excluded.max_quantity_per_item;

insert into public.hotel_supplies_hours (supplies_id, day_order, day_name, hours_text)
select s.id, d.day_order, d.day_name, d.hours_text
from public.hotel_supplies s
cross join (
  values
    (1, 'Pondělí', '06:00 - 20:00'), (2, 'Úterý', '06:00 - 20:00'), (3, 'Středa', '06:00 - 20:00'),
    (4, 'Čtvrtek', '06:00 - 20:00'), (5, 'Pátek', '06:00 - 20:00'), (6, 'Sobota', '06:00 - 20:00'),
    (7, 'Neděle', '06:00 - 20:00')
) as d (day_order, day_name, hours_text)
where s.slug = 'doplnky'
on conflict (supplies_id, day_order) do update set hours_text = excluded.hours_text;

insert into public.hotel_supplies_categories (supplies_id, slug, title, sort_order)
select s.id, c.slug, c.title, c.sort_order
from public.hotel_supplies s
cross join (values ('bathroom', 'Koupelna', 1), ('room', 'Pokojové doplňky', 2)) as c (slug, title, sort_order)
where s.slug = 'doplnky'
on conflict (supplies_id, slug) do update set title = excluded.title;

insert into public.hotel_supplies_items (category_id, slug, name, icon_emoji, sort_order)
select cat.id, i.slug, i.name, i.icon_emoji, i.sort_order
from public.hotel_supplies_categories cat
join public.hotel_supplies s on s.id = cat.supplies_id
cross join (values ('toilet', 'Toaletní papír', '🧻', 1), ('showergel', 'Sprchový gel', '🧴', 2), ('toothbrush', 'Kartáček na zuby', '🪥', 3)) as i (slug, name, icon_emoji, sort_order)
where s.slug = 'doplnky' and cat.slug = 'bathroom'
on conflict (category_id, slug) do update set name = excluded.name, icon_emoji = excluded.icon_emoji, sort_order = excluded.sort_order;

insert into public.hotel_supplies_items (category_id, slug, name, icon_emoji, sort_order)
select cat.id, i.slug, i.name, i.icon_emoji, i.sort_order
from public.hotel_supplies_categories cat
join public.hotel_supplies s on s.id = cat.supplies_id
cross join (values ('robe', 'Župan', '🥻', 1), ('handtowel', 'Ručník na ruce', '🖐️', 2), ('bathtowel', 'Osuška', '🛁', 3)) as i (slug, name, icon_emoji, sort_order)
where s.slug = 'doplnky' and cat.slug = 'room'
on conflict (category_id, slug) do update set name = excluded.name, icon_emoji = excluded.icon_emoji, sort_order = excluded.sort_order;

create or replace view public.hotel_supplies_export as
select
  s.slug as supplies_slug,
  s.title,
  s.description,
  s.schedule_summary,
  s.header_image_key,
  s.max_quantity_per_item,
  coalesce(
    (select json_agg(json_build_object('day_order', h.day_order, 'day_name', h.day_name, 'hours_text', h.hours_text) order by h.day_order)
     from public.hotel_supplies_hours h where h.supplies_id = s.id),
    '[]'::json
  ) as opening_hours,
  coalesce(
    (select json_agg(
      json_build_object(
        'slug', cat.slug, 'title', cat.title, 'sort_order', cat.sort_order,
        'items', (select coalesce(json_agg(json_build_object('slug', i.slug, 'name', i.name, 'icon_emoji', i.icon_emoji, 'sort_order', i.sort_order) order by i.sort_order), '[]'::json)
                from public.hotel_supplies_items i where i.category_id = cat.id and i.is_available)
      ) order by cat.sort_order)
     from public.hotel_supplies_categories cat where cat.supplies_id = s.id),
    '[]'::json
  ) as categories
from public.hotel_supplies s
where s.is_active;

grant select on public.hotel_supplies_export to anon, authenticated;
