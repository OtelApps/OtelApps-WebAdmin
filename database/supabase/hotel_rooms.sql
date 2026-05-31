-- =============================================================================
-- OtelApps — Nabídka pokojů (Superior, Executive, Junior Suite, Family Suite)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- =============================================================================

create table if not exists public.hotel_room_types (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null unique,
  title text not null,
  list_description text not null,
  detail_info text not null,
  size_text text,
  image_key text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_room_type_features (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.hotel_room_types (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  unique (room_type_id, label)
);

create table if not exists public.hotel_room_type_images (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.hotel_room_types (id) on delete cascade,
  image_key text,
  image_url text,
  sort_order int not null default 0,
  check (image_key is not null or image_url is not null)
);

create index if not exists idx_hotel_room_types_hotel on public.hotel_room_types (hotel_id);
create index if not exists idx_hotel_room_types_slug on public.hotel_room_types (slug);
create index if not exists idx_hotel_room_type_features_room on public.hotel_room_type_features (room_type_id);

alter table public.hotel_room_types enable row level security;
alter table public.hotel_room_type_features enable row level security;
alter table public.hotel_room_type_images enable row level security;

create policy "hotel_room_types_public_read"
  on public.hotel_room_types for select
  to anon, authenticated
  using (is_active = true);

create policy "hotel_room_type_features_public_read"
  on public.hotel_room_type_features for select
  to anon, authenticated
  using (true);

create policy "hotel_room_type_images_public_read"
  on public.hotel_room_type_images for select
  to anon, authenticated
  using (true);

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_room_types (
  hotel_id, slug, title, list_description, detail_info, size_text, image_key, sort_order
)
select
  h.id, r.slug, r.title, r.list_description, r.detail_info, r.size_text, r.image_key, r.sort_order
from h
cross join (
  values
    ('superior', 'Superior', 'Prostorný apartmán nabízí vše pro náročné cestovatele...', 'Prostorný apartmán nabízí vše pro náročné cestovatele. Samozřejmostí je Nespresso kávovar nebo možnost rozestýlky pro vaše pohodlí.', '32 m2', 'room', 1),
    ('executive', 'Executive', 'Prostorný apartmán nabízí vše pro náročné cestovatele...', 'Elegantní pokoj s výhledem na město, vlastní koupelnou a pracovním koutem.', '35 m2', 'room', 2),
    ('junior-suite', 'Junior Suite', 'Prostorný apartmán nabízí vše pro náročné cestovatele...', 'Prostorný apartmán nabízí vše pro náročné cestovatele. Samozřejmostí je Nespresso kávovar nebo možnost rozestýlky pro vaše pohodlí.', '38 m2', 'room', 3),
    ('family-suite', 'Family Suite', 'Prostorný apartmán nabízí vše pro náročné cestovatele...', 'Ideální pro rodiny s dětmi, dvě oddělené ložnice a velký obývací prostor.', '45 m2', 'room', 4)
) as r (slug, title, list_description, detail_info, size_text, image_key, sort_order)
on conflict (slug) do update set
  title = excluded.title,
  list_description = excluded.list_description,
  detail_info = excluded.detail_info,
  size_text = excluded.size_text,
  image_key = excluded.image_key,
  sort_order = excluded.sort_order;

insert into public.hotel_room_type_features (room_type_id, label, sort_order)
select rt.id, f.label, f.sort_order
from public.hotel_room_types rt
cross join (values ('Klimatizace', 1), ('Telefon', 2), ('Televize', 3), ('Wi-Fi', 4)) as f (label, sort_order)
where rt.slug = 'superior'
on conflict (room_type_id, label) do update set sort_order = excluded.sort_order;

insert into public.hotel_room_type_features (room_type_id, label, sort_order)
select rt.id, f.label, f.sort_order
from public.hotel_room_types rt
cross join (values ('Klimatizace', 1), ('Telefon', 2), ('Televize', 3), ('Volný vstup do posilovny', 4), ('Wi-Fi', 5)) as f (label, sort_order)
where rt.slug = 'executive'
on conflict (room_type_id, label) do update set sort_order = excluded.sort_order;

insert into public.hotel_room_type_features (room_type_id, label, sort_order)
select rt.id, f.label, f.sort_order
from public.hotel_room_types rt
cross join (values ('Klimatizace', 1), ('Telefon', 2), ('Televize', 3), ('Volný vstup do posilovny', 4), ('Wi-Fi', 5)) as f (label, sort_order)
where rt.slug = 'junior-suite'
on conflict (room_type_id, label) do update set sort_order = excluded.sort_order;

insert into public.hotel_room_type_features (room_type_id, label, sort_order)
select rt.id, f.label, f.sort_order
from public.hotel_room_types rt
cross join (values ('Klimatizace', 1), ('Telefon', 2), ('Televize', 3), ('Dětská postýlka', 4), ('Wi-Fi', 5)) as f (label, sort_order)
where rt.slug = 'family-suite'
on conflict (room_type_id, label) do update set sort_order = excluded.sort_order;

create or replace view public.hotel_room_types_export as
select
  rt.slug as room_slug,
  rt.title,
  rt.list_description,
  rt.detail_info,
  rt.size_text,
  rt.image_key,
  rt.sort_order,
  coalesce(
    (select json_agg(f.label order by f.sort_order) from public.hotel_room_type_features f where f.room_type_id = rt.id),
    '[]'::json
  ) as features,
  coalesce(
    (
      select json_agg(
        json_build_object('image_key', i.image_key, 'image_url', i.image_url, 'sort_order', i.sort_order)
        order by i.sort_order
      )
      from public.hotel_room_type_images i
      where i.room_type_id = rt.id
    ),
    '[]'::json
  ) as gallery
from public.hotel_room_types rt
where rt.is_active
order by rt.sort_order;

grant select on public.hotel_room_types_export to anon, authenticated;
