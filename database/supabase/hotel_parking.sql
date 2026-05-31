-- =============================================================================
-- OtelApps — Parkování (hotel + externí odkaz na Prahu)
-- Spusť v Supabase: SQL Editor → New query → Run
-- =============================================================================

create table if not exists public.hotel_parking_topics (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null unique,
  title text not null,
  list_description text not null,
  detail_info text,
  list_image_key text,
  detail_image_key text,
  navigation_screen text check (navigation_screen in ('ParkingDetail')),
  external_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (navigation_screen is not null or external_url is not null)
);

create index if not exists idx_hotel_parking_topics_hotel on public.hotel_parking_topics (hotel_id);
create index if not exists idx_hotel_parking_topics_slug on public.hotel_parking_topics (slug);

alter table public.hotel_parking_topics enable row level security;

create policy "hotel_parking_topics_public_read"
  on public.hotel_parking_topics for select
  to anon, authenticated
  using (is_active = true);

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_parking_topics (
  hotel_id, slug, title, list_description, detail_info,
  list_image_key, detail_image_key, navigation_screen, external_url, sort_order
)
select
  h.id,
  t.slug,
  t.title,
  t.list_description,
  t.detail_info,
  t.list_image_key,
  t.detail_image_key,
  t.navigation_screen,
  t.external_url,
  t.sort_order
from h
cross join (
  values
    (
      'hotel-parking',
      'Parkování v našem hotelu',
      'Důležíté informace které potřebujete vědět o parkování v našem hotelu',
      E'Vážení hosté,\n\nnabízíme možnost parkování přímo v areálu hotelu.\n\nCena parkování je 500 Kč / noc.\n\nRezervace parkovacího místa je nutná předem na recepci.\n\nPři příjezdu prosím zastavte před hotelem a nahlaste se na recepci, kde Vám sdělíme číslo Vašeho parkovacího místa.',
      'reception',
      'reception',
      'ParkingDetail',
      null,
      1
    ),
    (
      'prague-parking',
      'Parkování v Praze',
      'Veškeré informace o Parkování v Praze naleznete na hlavních stránkách Parking.Praha.eu',
      null,
      'prague',
      null,
      null,
      'https://parking.praha.eu',
      2
    )
) as t (
  slug, title, list_description, detail_info,
  list_image_key, detail_image_key, navigation_screen, external_url, sort_order
)
on conflict (slug) do update set
  title = excluded.title,
  list_description = excluded.list_description,
  detail_info = excluded.detail_info,
  list_image_key = excluded.list_image_key,
  detail_image_key = excluded.detail_image_key,
  navigation_screen = excluded.navigation_screen,
  external_url = excluded.external_url,
  sort_order = excluded.sort_order;

create or replace view public.hotel_parking_export as
select
  t.slug as topic_slug,
  t.title,
  t.list_description,
  t.detail_info,
  t.list_image_key,
  coalesce(t.detail_image_key, t.list_image_key) as detail_image_key,
  t.navigation_screen,
  t.external_url,
  t.sort_order
from public.hotel_parking_topics t
where t.is_active
order by t.sort_order;

grant select on public.hotel_parking_export to anon, authenticated;
