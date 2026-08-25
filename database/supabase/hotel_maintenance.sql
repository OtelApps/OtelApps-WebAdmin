-- =============================================================================
-- OtelApps — Údržba & opravy (Services → Issues & repairs)
-- Spusť v Supabase: SQL Editor → Run
-- =============================================================================

create table if not exists public.hotel_maintenance (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null default 'udrzba-opravy',
  title text not null default 'Údržba & opravy',
  description text not null,
  description_extra text,
  schedule_summary text,
  header_image_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, slug)
);

create table if not exists public.hotel_maintenance_hours (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.hotel_maintenance (id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  day_name text not null,
  hours_text text not null,
  unique (maintenance_id, day_order)
);

create table if not exists public.hotel_maintenance_categories (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.hotel_maintenance (id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  unique (maintenance_id, slug)
);

create table if not exists public.hotel_maintenance_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.hotel_maintenance_categories (id) on delete cascade,
  slug text not null,
  label text not null,
  icon_library text not null default 'ionicons' check (icon_library in ('ionicons', 'material-community')),
  icon_name text not null,
  sort_order int not null default 0,
  is_available boolean not null default true,
  unique (category_id, slug)
);

create index if not exists idx_hotel_maintenance_hotel on public.hotel_maintenance (hotel_id);
create index if not exists idx_hotel_maintenance_hours_maintenance on public.hotel_maintenance_hours (maintenance_id);
create index if not exists idx_hotel_maintenance_categories_maintenance on public.hotel_maintenance_categories (maintenance_id);
create index if not exists idx_hotel_maintenance_items_category on public.hotel_maintenance_items (category_id);

alter table public.hotel_maintenance enable row level security;
alter table public.hotel_maintenance_hours enable row level security;
alter table public.hotel_maintenance_categories enable row level security;
alter table public.hotel_maintenance_items enable row level security;

create policy "hotel_maintenance_public_read" on public.hotel_maintenance for select to anon, authenticated using (is_active = true);
create policy "hotel_maintenance_hours_public_read" on public.hotel_maintenance_hours for select to anon, authenticated using (true);
create policy "hotel_maintenance_categories_public_read" on public.hotel_maintenance_categories for select to anon, authenticated using (true);
create policy "hotel_maintenance_items_public_read" on public.hotel_maintenance_items for select to anon, authenticated using (is_available = true);

insert into public.hotels (slug, name) values ('default', 'OtelApps Hotel') on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_maintenance (hotel_id, slug, title, description, description_extra, schedule_summary, header_image_key)
select h.id, 'udrzba-opravy', 'Údržba & opravy',
  'Něco se porouchalo a nevíte si rady? Neváhejte nám poslat požadavek a my k Vám na pokoj obratem pošleme našeho technika.',
  'Záleží nám na Vašem pohodlí a proto dbáme o kvalitní a rychlý program údržby.',
  '06:00 - 20:00', 'headerMaintenance'
from h
on conflict (hotel_id, slug) do update set
  title = excluded.title, description = excluded.description, description_extra = excluded.description_extra,
  schedule_summary = excluded.schedule_summary, header_image_key = excluded.header_image_key;

insert into public.hotel_maintenance_hours (maintenance_id, day_order, day_name, hours_text)
select m.id, d.day_order, d.day_name, d.hours_text from public.hotel_maintenance m
cross join (values
  (1, 'Pondělí', '06:00 - 20:00'), (2, 'Úterý', '06:00 - 20:00'), (3, 'Středa', '06:00 - 20:00'),
  (4, 'Čtvrtek', '06:00 - 20:00'), (5, 'Pátek', '06:00 - 20:00'), (6, 'Sobota', '06:00 - 20:00'),
  (7, 'Neděle', '06:00 - 20:00')
) as d (day_order, day_name, hours_text) where m.slug = 'udrzba-opravy'
on conflict (maintenance_id, day_order) do update set hours_text = excluded.hours_text;

insert into public.hotel_maintenance_categories (maintenance_id, slug, title, sort_order)
select m.id, c.slug, c.title, c.sort_order from public.hotel_maintenance m
cross join (values ('elektronika', 'Elektronika', 1), ('obecne', 'Obecné', 2)) as c (slug, title, sort_order)
where m.slug = 'udrzba-opravy' on conflict (maintenance_id, slug) do update set title = excluded.title;

insert into public.hotel_maintenance_items (category_id, slug, label, icon_library, icon_name, sort_order)
select cat.id, i.slug, i.label, i.icon_library, i.icon_name, i.sort_order
from public.hotel_maintenance_categories cat join public.hotel_maintenance m on m.id = cat.maintenance_id
cross join (values ('svetla', 'Světla', 'ionicons', 'bulb-outline', 1)) as i (slug, label, icon_library, icon_name, sort_order)
where m.slug = 'udrzba-opravy' and cat.slug = 'elektronika'
on conflict (category_id, slug) do update set label = excluded.label, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

insert into public.hotel_maintenance_items (category_id, slug, label, icon_library, icon_name, sort_order)
select cat.id, i.slug, i.label, i.icon_library, i.icon_name, i.sort_order
from public.hotel_maintenance_categories cat join public.hotel_maintenance m on m.id = cat.maintenance_id
cross join (values ('sprcha', 'Sprcha', 'ionicons', 'water-outline', 1)) as i (slug, label, icon_library, icon_name, sort_order)
where m.slug = 'udrzba-opravy' and cat.slug = 'obecne'
on conflict (category_id, slug) do update set label = excluded.label, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

create or replace view public.hotel_maintenance_export as
select m.slug as maintenance_slug, m.title, m.description, m.description_extra, m.schedule_summary, m.header_image_key,
  coalesce((select json_agg(json_build_object('day_order', h.day_order, 'day_name', h.day_name, 'hours_text', h.hours_text) order by h.day_order)
    from public.hotel_maintenance_hours h where h.maintenance_id = m.id), '[]'::json) as opening_hours,
  coalesce((select json_agg(json_build_object('slug', cat.slug, 'title', cat.title, 'sort_order', cat.sort_order,
    'items', (select coalesce(json_agg(json_build_object('slug', i.slug, 'label', i.label, 'icon_library', i.icon_library, 'icon_name', i.icon_name, 'sort_order', i.sort_order) order by i.sort_order), '[]'::json)
      from public.hotel_maintenance_items i where i.category_id = cat.id and i.is_available)) order by cat.sort_order)
    from public.hotel_maintenance_categories cat where cat.maintenance_id = m.id), '[]'::json) as categories
from public.hotel_maintenance m where m.is_active;

grant select on public.hotel_maintenance_export to anon, authenticated;
