-- =============================================================================
-- OtelApps — Památky a místa (mapa + trip planner)
-- Spusť v Supabase: SQL Editor → New query → Run
-- =============================================================================

create table if not exists public.hotel_places (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null,
  name text not null,
  description text not null default '',
  long_description text,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  category text not null default 'place'
    check (category in ('place', 'atm', 'other')),
  opening_hours text,
  admission text,
  image_url text,
  is_recommended boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, slug)
);

create index if not exists idx_hotel_places_hotel on public.hotel_places (hotel_id);
create index if not exists idx_hotel_places_active on public.hotel_places (hotel_id, is_active);
create index if not exists idx_hotel_places_recommended on public.hotel_places (hotel_id, is_recommended)
  where is_recommended = true;

alter table public.hotel_places enable row level security;

drop policy if exists "hotel_places_public_read" on public.hotel_places;
create policy "hotel_places_public_read"
  on public.hotel_places for select
  to anon, authenticated
  using (is_active = true);

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_places (
  hotel_id, slug, name, description, long_description, address,
  latitude, longitude, category, opening_hours, admission,
  is_recommended, sort_order
)
select
  h.id,
  t.slug,
  t.name,
  t.description,
  t.long_description,
  t.address,
  t.latitude,
  t.longitude,
  t.category,
  t.opening_hours,
  t.admission,
  t.is_recommended,
  t.sort_order
from h
cross join (
  values
    ('karluv-most', 'Karlův most', 'Historický most spojující Staré Město a Malou Stranu.',
     'Karlův most je nejstarší dochovaný most přes Vltavu v Praze.',
     'Karlův most, Praha', 50.0865, 14.4114, 'place', 'Otevřeno 24/7', 'Zdarma', true, 1),
    ('staromestske-namesti', 'Staroměstské náměstí', 'Centrální náměstí s orlojem a Týnským chrámem.',
     'Historické centrum Prahy s orlojem, Týnským chrámem a množstvím kaváren.',
     'Staroměstské náměstí, Praha', 50.0875, 14.4213, 'place', 'Otevřeno 24/7', 'Zdarma', true, 2),
    ('petrinska-rozhledna', 'Petřínská rozhledna', 'Vyhlídková věž s krásným výhledem na Prahu.',
     'Vyhlídková věž inspirovaná Eiffelovkou.',
     'Petřínské sady, Praha', 50.0838, 14.3972, 'place', '10:00–20:00', '150 Kč', false, 3),
    ('vysehrad', 'Vyšehrad', 'Historická pevnost s parkem a výhledem na Vltavu.',
     'Historická pevnost s parkem, bazilikou a vyhlídkou.',
     'V Pevnosti, Praha', 50.0641, 14.4200, 'place', '06:00–22:00', 'Zdarma', true, 4),
    ('narodni-muzeum', 'Národní muzeum', 'Hlavní budova Národního muzea na Václavském náměstí.',
     'Nejvýznamnější muzeum v Česku.',
     'Václavské náměstí 68, Praha', 50.0796, 14.4307, 'place', '10:00–18:00', 'dle expozice', false, 5),
    ('katedrala-sv-vita', 'Katedrála sv. Víta', 'Gotická katedrála na Pražském hradě.',
     'Dominantní chrám Pražského hradu.',
     'Pražský hrad, Praha', 50.0909, 14.4005, 'place', '09:00–17:00', 'vstupenka hrad', true, 6),
    ('tancici-dum', 'Tančící dům', 'Moderní architektura na nábřeží Vltavy.',
     'Ikona pražské moderní architektury.',
     'Jiráskovo náměstí 1981/6, Praha', 50.0755, 14.4141, 'place', 'exteriér 24/7', 'Zdarma (exteriér)', false, 7),
    ('josefov', 'Josefov', 'Historická židovská čtvrť.',
     'Areál synagog a Starého židovského hřbitova.',
     'Josefov, Praha', 50.0900, 14.4186, 'place', 'dle objektů', 'dle objektů', false, 8),
    ('letenske-sady', 'Letenské sady', 'Park s výhledem na město a Vltavu.',
     'Oblíbené místo na procházky a výhledy.',
     'Letenské sady, Praha', 50.0960, 14.4180, 'place', 'Otevřeno 24/7', 'Zdarma', false, 9),
    ('strahovsky-klaster', 'Strahovský klášter', 'Klášter s knihovnou a pivovarem.',
     'Premonstrátský klášter nad Malou Stranou.',
     'Strahovské nádvoří 1/132, Praha', 50.0863, 14.3893, 'place', 'dle prohlídek', 'dle prohlídek', false, 10)
) as t (
  slug, name, description, long_description, address,
  latitude, longitude, category, opening_hours, admission,
  is_recommended, sort_order
)
on conflict (hotel_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  long_description = excluded.long_description,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  category = excluded.category,
  opening_hours = excluded.opening_hours,
  admission = excluded.admission,
  is_recommended = excluded.is_recommended,
  sort_order = excluded.sort_order,
  updated_at = now();

create or replace view public.hotel_places_export as
select
  p.slug,
  p.name,
  p.description,
  p.long_description,
  p.address,
  p.latitude,
  p.longitude,
  p.category,
  p.opening_hours,
  p.admission,
  p.image_url,
  p.is_recommended,
  p.sort_order
from public.hotel_places p
where p.is_active
order by p.is_recommended desc, p.sort_order, p.name;

grant select on public.hotel_places_export to anon, authenticated;
