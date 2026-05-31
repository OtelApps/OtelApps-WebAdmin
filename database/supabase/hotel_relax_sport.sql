-- =============================================================================
-- OtelApps — Relax & Sport (jedna admin instance: Wellness & SPA + Posilovna & Sport)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: public.hotels + wellness_* tabulky už existují.
-- =============================================================================

create table if not exists public.hotel_relax_sport (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references public.hotels (id) on delete cascade,
  section_title text not null default 'Relax a Sport',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_relax_sport_areas (
  id uuid primary key default gen_random_uuid(),
  relax_sport_id uuid not null references public.hotel_relax_sport (id) on delete cascade,
  slug text not null check (slug in ('wellness-spa', 'gym-sport')),
  home_title text not null,
  home_image_key text,
  list_screen text not null check (
    list_screen in ('WellnessSpaList', 'PosilovnaSportList')
  ),
  list_title text not null,
  is_enabled boolean not null default true,
  sort_order smallint not null default 0,
  unique (relax_sport_id, slug)
);

create table if not exists public.fitness_facilities (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null unique,
  title text not null,
  list_label text,
  schedule_summary text,
  description_long text,
  image_key text,
  detail_screen text not null check (
    detail_screen in ('GymDetail', 'TenisoveKurtyDetail')
  ),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fitness_facility_hours (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.fitness_facilities (id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  day_name text not null,
  hours_text text not null,
  unique (facility_id, day_order)
);

create table if not exists public.fitness_facility_images (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.fitness_facilities (id) on delete cascade,
  image_key text,
  image_url text,
  sort_order int not null default 0,
  check (image_key is not null or image_url is not null)
);

create index if not exists idx_hotel_relax_sport_hotel on public.hotel_relax_sport (hotel_id);
create index if not exists idx_relax_sport_areas_relax on public.hotel_relax_sport_areas (relax_sport_id);
create index if not exists idx_fitness_facilities_hotel on public.fitness_facilities (hotel_id);
create index if not exists idx_fitness_facilities_slug on public.fitness_facilities (slug);
create index if not exists idx_fitness_facility_hours_facility on public.fitness_facility_hours (facility_id);

alter table public.hotel_relax_sport enable row level security;
alter table public.hotel_relax_sport_areas enable row level security;
alter table public.fitness_facilities enable row level security;
alter table public.fitness_facility_hours enable row level security;
alter table public.fitness_facility_images enable row level security;

create policy "hotel_relax_sport_public_read"
  on public.hotel_relax_sport for select
  to anon, authenticated
  using (is_active = true);

create policy "hotel_relax_sport_areas_public_read"
  on public.hotel_relax_sport_areas for select
  to anon, authenticated
  using (
    is_enabled = true
    and exists (
      select 1
      from public.hotel_relax_sport rs
      where rs.id = relax_sport_id
        and rs.is_active = true
    )
  );

create policy "fitness_facilities_public_read"
  on public.fitness_facilities for select
  to anon, authenticated
  using (is_active = true);

create policy "fitness_facility_hours_public_read"
  on public.fitness_facility_hours for select
  to anon, authenticated
  using (true);

create policy "fitness_facility_images_public_read"
  on public.fitness_facility_images for select
  to anon, authenticated
  using (true);

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_relax_sport (hotel_id, section_title)
select h.id, 'Relax a Sport'
from h
on conflict (hotel_id) do update set
  section_title = excluded.section_title;

with rs as (
  select rs.id
  from public.hotel_relax_sport rs
  join public.hotels h on h.id = rs.hotel_id
  where h.slug = 'default'
)
insert into public.hotel_relax_sport_areas (
  relax_sport_id, slug, home_title, home_image_key, list_screen, list_title, sort_order
)
select rs.id, a.slug, a.home_title, a.home_image_key, a.list_screen, a.list_title, a.sort_order
from rs
cross join (
  values
    ('wellness-spa', 'Wellness & SPA', 'sauna', 'WellnessSpaList', 'Wellness & SPA', 1),
    ('gym-sport', 'Posilovna a sport', 'gym', 'PosilovnaSportList', 'Posilovna & Sport', 2)
) as a (slug, home_title, home_image_key, list_screen, list_title, sort_order)
on conflict (relax_sport_id, slug) do update set
  home_title = excluded.home_title,
  home_image_key = excluded.home_image_key,
  list_screen = excluded.list_screen,
  list_title = excluded.list_title,
  sort_order = excluded.sort_order;

with h as (select id from public.hotels where slug = 'default')
insert into public.fitness_facilities (
  hotel_id, slug, title, list_label, schedule_summary, description_long,
  image_key, detail_screen, sort_order
)
select
  h.id,
  'gym',
  'Hotelová posilovna',
  'Posilovna & Sport',
  'Od 11:00 - Do 21:00',
  'Navštivte naši moderně vybavenou posilovnu, kde najdete širokou škálu strojů a vybavení pro kardio i silový trénink.' || E'\n\n' ||
  'Chcete začít den cvičením nebo si dopřát odpolední trénink? Naše fitness centrum je vám k dispozici. Udržujte si kondici v pohodlí hotelu.',
  'gym',
  'GymDetail',
  1
from h
on conflict (slug) do update set
  title = excluded.title,
  list_label = excluded.list_label,
  schedule_summary = excluded.schedule_summary,
  description_long = excluded.description_long,
  image_key = excluded.image_key;

insert into public.fitness_facility_hours (facility_id, day_order, day_name, hours_text)
select f.id, d.day_order, d.day_name, d.hours_text
from public.fitness_facilities f
cross join (
  values
    (1, 'Pondělí', '08:00 - 21:00'),
    (2, 'Úterý', '08:00 - 21:00'),
    (3, 'Středa', '08:00 - 21:00'),
    (4, 'Čtvrtek', '08:00 - 21:00'),
    (5, 'Pátek', '08:00 - 21:00'),
    (6, 'Sobota', '08:00 - 21:00'),
    (7, 'Neděle', '08:00 - 21:00')
) as d (day_order, day_name, hours_text)
where f.slug = 'gym'
on conflict (facility_id, day_order) do update set hours_text = excluded.hours_text;

delete from public.fitness_facility_images i
using public.fitness_facilities f
where i.facility_id = f.id and f.slug = 'gym';

insert into public.fitness_facility_images (facility_id, image_key, sort_order)
select f.id, img.image_key, img.sort_order
from public.fitness_facilities f
cross join (
  values
    ('gym', 1),
    ('room', 2)
) as img (image_key, sort_order)
where f.slug = 'gym';

with h as (select id from public.hotels where slug = 'default')
insert into public.fitness_facilities (
  hotel_id, slug, title, list_label, schedule_summary, description_long,
  image_key, detail_screen, sort_order
)
select
  h.id,
  'tenis',
  'Tenisové kurty',
  'Posilovna & Sport',
  'Od 16:00 - Do 22:00',
  'Užijte si aktivní odpočinek na našich tenisových kurtech, které se nacházejí přímo v areálu hotelu.' || E'\n\n' ||
  'Ať už jste začátečník nebo pokročilý hráč, kurty jsou vám k dispozici pro rekreační hru i trénink. Rezervujte si svůj čas a vychutnejte si sportovní zážitek na čerstvém vzduchu.',
  'gym',
  'TenisoveKurtyDetail',
  2
from h
on conflict (slug) do update set
  title = excluded.title,
  schedule_summary = excluded.schedule_summary,
  description_long = excluded.description_long;

insert into public.fitness_facility_hours (facility_id, day_order, day_name, hours_text)
select f.id, d.day_order, d.day_name, d.hours_text
from public.fitness_facilities f
cross join (
  values
    (1, 'Pondělí', '08:00 - 22:00'),
    (2, 'Úterý', '08:00 - 22:00'),
    (3, 'Středa', '08:00 - 22:00'),
    (4, 'Čtvrtek', '08:00 - 22:00'),
    (5, 'Pátek', '08:00 - 22:00'),
    (6, 'Sobota', '09:00 - 21:00'),
    (7, 'Neděle', '09:00 - 21:00')
) as d (day_order, day_name, hours_text)
where f.slug = 'tenis'
on conflict (facility_id, day_order) do update set hours_text = excluded.hours_text;

create or replace view public.relax_sport_home_export as
select
  h.slug as hotel_slug,
  rs.section_title,
  a.slug as area_slug,
  a.home_title,
  a.home_image_key,
  a.list_screen,
  a.list_title,
  a.sort_order,
  count(*) over (partition by rs.id) as enabled_area_count
from public.hotel_relax_sport rs
join public.hotels h on h.id = rs.hotel_id
join public.hotel_relax_sport_areas a on a.relax_sport_id = rs.id
where rs.is_active = true
  and a.is_enabled = true
order by a.sort_order;

create or replace view public.fitness_facility_export as
select
  f.slug as facility_slug,
  f.title,
  f.list_label,
  f.schedule_summary,
  f.description_long,
  f.image_key,
  f.detail_screen,
  f.sort_order,
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
      from public.fitness_facility_hours h
      where h.facility_id = f.id
    ),
    '[]'::json
  ) as opening_hours,
  coalesce(
    (
      select json_agg(
        json_build_object(
          'image_key', i.image_key,
          'image_url', i.image_url,
          'sort_order', i.sort_order
        )
        order by i.sort_order
      )
      from public.fitness_facility_images i
      where i.facility_id = f.id
    ),
    '[]'::json
  ) as images
from public.fitness_facilities f
where f.is_active
order by f.sort_order;

grant select on public.relax_sport_home_export to anon, authenticated;
grant select on public.fitness_facility_export to anon, authenticated;
