-- =============================================================================
-- OtelApps — Informace o hotelu (Vítejte, Recepce, Spojení, Sejf, Mapa)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: tabulka public.hotels už existuje (migrace restaurací).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabulky
-- -----------------------------------------------------------------------------

create table if not exists public.hotel_info_topics (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null unique,
  title text not null,
  list_description text not null,
  detail_info text,
  list_image_key text,
  detail_image_key text,
  navigation_screen text not null check (
    navigation_screen in (
      'HotelDetail',
      'RecepceDetail',
      'SpojeniDetail',
      'SejfDetail',
      'MapScreen'
    )
  ),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_info_sections (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.hotel_info_topics (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null,
  icon_library text not null default 'ionicons' check (
    icon_library in ('ionicons', 'material-community')
  ),
  icon_name text not null,
  sort_order int not null default 0,
  unique (topic_id, slug)
);

create index if not exists idx_hotel_info_topics_hotel on public.hotel_info_topics (hotel_id);
create index if not exists idx_hotel_info_topics_slug on public.hotel_info_topics (slug);
create index if not exists idx_hotel_info_sections_topic on public.hotel_info_sections (topic_id);

alter table public.hotel_info_topics enable row level security;
alter table public.hotel_info_sections enable row level security;

create policy "hotel_info_topics_public_read"
  on public.hotel_info_topics for select
  to anon, authenticated
  using (is_active = true);

create policy "hotel_info_sections_public_read"
  on public.hotel_info_sections for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Seed: data z aplikace (HotelInfoListScreen + detaily)
-- -----------------------------------------------------------------------------

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_info_topics (
  hotel_id, slug, title, list_description, detail_info,
  list_image_key, detail_image_key, navigation_screen, sort_order
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
  t.sort_order
from h
cross join (
  values
    ('vitejte', 'Vítejte', 'Hlavní informace, které se Vám při příjezdu budou hodit.', 'Vedení hotelu a zaměstnanci vás vítá a nabízíme vám tuto aplikaci se zajímavými informacemi, abyste si svůj pobyt lépe užili.', 'welcome', 'prague', 'HotelDetail', 1),
    ('recepce', 'Recepce', 'S radostí Vás přivítáme na naší recepci.', 'Náš přátelský personál recepce je Vám k dispozici 24 hodin denně, 7 dní v týdnu. Rádi Vám pomůžeme s jakýmkoliv dotazem, žádostí nebo rezervací služeb.', 'reception', 'reception', 'RecepceDetail', 2),
    ('spojeni', 'Neustále ve spojení', 'Díky naší aplikace jste s námi neustále ve spojení.', 'S naší mobilní aplikací máte veškeré důležité informace a služby hotelu na dosah ruky. Zůstaňte s námi ve spojení pro ještě lepší zážitek z pobytu.', 'intouch', 'intouch', 'SpojeniDetail', 3),
    ('sejft', 'Bezpečnostní sejf', 'Sejf je uložený ve skříni po levé straně.', 'V každém pokoji naleznete bezpečnostní sejf pro uložení vašich cenností. Postup pro použití naleznete přímo u sejfu nebo se informujte na recepci.', 'safe', 'safe', 'SejfDetail', 4),
    ('mapa', 'Mapa hotelu', 'Zobrazit mapu hotelu a okolí.', null, 'homeMap', null, 'MapScreen', 5)
) as t (slug, title, list_description, detail_info, list_image_key, detail_image_key, navigation_screen, sort_order)
on conflict (slug) do update set
  title = excluded.title,
  list_description = excluded.list_description,
  detail_info = excluded.detail_info,
  list_image_key = excluded.list_image_key,
  detail_image_key = excluded.detail_image_key,
  navigation_screen = excluded.navigation_screen,
  sort_order = excluded.sort_order;

insert into public.hotel_info_sections (topic_id, slug, title, description, icon_library, icon_name, sort_order)
select t.id, s.slug, s.title, s.description, s.icon_library, s.icon_name, s.sort_order
from public.hotel_info_topics t
cross join (values
  ('recepce', 'Recepce', 'Ve vstupní hale na Vás čeká náš tým zkušených recepčních, kteří Vám pomohou se všenu druhy požadavků', 'ionicons', 'person-outline', 1),
  ('sejft', 'Bezpečnostní sejf', 'Je umístěn ve skříni po pravé straně. Doporučujeme sejf využít k úschově cenností.', 'material-community', 'safe', 2),
  ('platba', 'Platba příplatků', 'Veškeré platby za dodatečné služby budou připsány na Váš pokoj a vyúčtovány při Vašem check-outu.', 'material-community', 'credit-card', 3)
) as s (slug, title, description, icon_library, icon_name, sort_order)
where t.slug = 'vitejte'
on conflict (topic_id, slug) do update set title = excluded.title, description = excluded.description, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

insert into public.hotel_info_sections (topic_id, slug, title, description, icon_library, icon_name, sort_order)
select t.id, s.slug, s.title, s.description, s.icon_library, s.icon_name, s.sort_order
from public.hotel_info_topics t
cross join (values
  ('checkin', 'Check-in & Check-out', 'Check-in je možný od 14:00, check-out do 11:00. Možnost pozdního odjezdu za příplatek.', 'ionicons', 'log-in-outline', 1),
  ('sluzby', 'Rezervace služeb', 'Rezervace restaurací, wellness, sportovních aktivit a dalších hotelových služeb.', 'material-community', 'room-service-outline', 2),
  ('info', 'Informace', 'Informace o okolí, dopravě, památkách a dalších zajímavostech v okolí hotelu.', 'ionicons', 'information-circle-outline', 3)
) as s (slug, title, description, icon_library, icon_name, sort_order)
where t.slug = 'recepce'
on conflict (topic_id, slug) do update set title = excluded.title, description = excluded.description, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

insert into public.hotel_info_sections (topic_id, slug, title, description, icon_library, icon_name, sort_order)
select t.id, s.slug, s.title, s.description, s.icon_library, s.icon_name, s.sort_order
from public.hotel_info_topics t
cross join (values
  ('chat', 'Chat s personálem', 'Okamžitá komunikace s recepcí, pokojovou službou a dalšími odděleními hotelu.', 'ionicons', 'chatbubbles-outline', 1),
  ('sluzby', 'Objednávka služeb', 'Objednejte si úklid pokoje, room service nebo další hotelové služby přímo z aplikace.', 'material-community', 'room-service-outline', 2),
  ('notifikace', 'Oznámení', 'Dostávejte důležitá oznámení o událostech, aktivitách a speciálních nabídkách.', 'ionicons', 'notifications-outline', 3)
) as s (slug, title, description, icon_library, icon_name, sort_order)
where t.slug = 'spojeni'
on conflict (topic_id, slug) do update set title = excluded.title, description = excluded.description, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

insert into public.hotel_info_sections (topic_id, slug, title, description, icon_library, icon_name, sort_order)
select t.id, s.slug, s.title, s.description, s.icon_library, s.icon_name, s.sort_order
from public.hotel_info_topics t
cross join (values
  ('instrukce', 'Návod k použití', E'1. Zadejte svůj PIN kód\n2. Zavřete dvířka\n3. Otočte klíčem\n4. Ověřte, že sejf je zamčený', 'ionicons', 'help-circle-outline', 1),
  ('velikost', 'Rozměry sejfu', E'Vnitřní rozměry: 30 x 20 x 15 cm\nVhodné pro notebook, dokumenty a cennosti.', 'material-community', 'ruler-square', 2),
  ('bezpecnost', 'Bezpečnostní prvky', 'Elektronický zámek, protipožární ochrana, možnost resetu PINu na recepci.', 'ionicons', 'shield-checkmark-outline', 3)
) as s (slug, title, description, icon_library, icon_name, sort_order)
where t.slug = 'sejft'
on conflict (topic_id, slug) do update set title = excluded.title, description = excluded.description, icon_library = excluded.icon_library, icon_name = excluded.icon_name, sort_order = excluded.sort_order;

create or replace view public.hotel_info_export as
select
  t.slug as topic_slug,
  t.title,
  t.list_description,
  t.detail_info,
  t.list_image_key,
  coalesce(t.detail_image_key, t.list_image_key) as detail_image_key,
  t.navigation_screen,
  t.sort_order,
  coalesce(
    (
      select json_agg(
        json_build_object(
          'slug', s.slug,
          'title', s.title,
          'description', s.description,
          'icon_library', s.icon_library,
          'icon_name', s.icon_name,
          'sort_order', s.sort_order
        )
        order by s.sort_order
      )
      from public.hotel_info_sections s
      where s.topic_id = t.id
    ),
    '[]'::json
  ) as sections
from public.hotel_info_topics t
where t.is_active
order by t.sort_order;

grant select on public.hotel_info_export to anon, authenticated;
