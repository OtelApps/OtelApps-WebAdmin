-- =============================================================================
-- OtelApps — Pokojová služba (Snídaně, Oběd, Večeře)
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: tabulka public.hotels už existuje (migrace restaurací).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabulky
-- -----------------------------------------------------------------------------

create table if not exists public.hotel_room_service_menus (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  slug text not null unique,
  title text not null,
  list_label text not null default 'Pokojová služba',
  list_schedule_summary text,
  list_image_key text,
  navigation_screen text not null check (
    navigation_screen in ('SnidaneScreen', 'ObedScreen', 'VecereScreen')
  ),
  confirm_screen text not null check (
    confirm_screen in ('ConfirmSnidaneScreen', 'ConfirmObedScreen', 'ConfirmVecereScreen')
  ),
  description text not null,
  schedule_summary text,
  header_image_key text,
  juice_modal_title text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.hotel_room_service_hours (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.hotel_room_service_menus (id) on delete cascade,
  day_order smallint not null check (day_order between 1 and 7),
  day_name text not null,
  hours_text text not null,
  unique (menu_id, day_order)
);

create table if not exists public.hotel_room_service_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.hotel_room_service_menus (id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  unique (menu_id, slug)
);

create table if not exists public.hotel_room_service_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.hotel_room_service_categories (id) on delete cascade,
  slug text not null,
  name text not null,
  description_short text,
  icon_emoji text,
  price_amount numeric(10, 1) not null check (price_amount >= 0),
  currency text not null default 'CZK',
  requires_option boolean not null default false,
  sort_order int not null default 0,
  is_available boolean not null default true,
  unique (category_id, slug)
);

create table if not exists public.hotel_room_service_item_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.hotel_room_service_items (id) on delete cascade,
  slug text not null,
  label text not null,
  price_amount numeric(10, 1) not null check (price_amount >= 0),
  sort_order int not null default 0,
  unique (item_id, slug)
);

create index if not exists idx_hotel_room_service_menus_hotel on public.hotel_room_service_menus (hotel_id);
create index if not exists idx_hotel_room_service_hours_menu on public.hotel_room_service_hours (menu_id);
create index if not exists idx_hotel_room_service_categories_menu on public.hotel_room_service_categories (menu_id);
create index if not exists idx_hotel_room_service_items_category on public.hotel_room_service_items (category_id);
create index if not exists idx_hotel_room_service_item_options_item on public.hotel_room_service_item_options (item_id);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.hotel_room_service_menus enable row level security;
alter table public.hotel_room_service_hours enable row level security;
alter table public.hotel_room_service_categories enable row level security;
alter table public.hotel_room_service_items enable row level security;
alter table public.hotel_room_service_item_options enable row level security;

create policy "hotel_room_service_menus_public_read"
  on public.hotel_room_service_menus for select
  to anon, authenticated
  using (is_active = true);

create policy "hotel_room_service_hours_public_read"
  on public.hotel_room_service_hours for select
  to anon, authenticated
  using (true);

create policy "hotel_room_service_categories_public_read"
  on public.hotel_room_service_categories for select
  to anon, authenticated
  using (true);

create policy "hotel_room_service_items_public_read"
  on public.hotel_room_service_items for select
  to anon, authenticated
  using (is_available = true);

create policy "hotel_room_service_item_options_public_read"
  on public.hotel_room_service_item_options for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Seed
-- -----------------------------------------------------------------------------

insert into public.hotels (slug, name)
values ('default', 'OtelApps Hotel')
on conflict (slug) do nothing;

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_room_service_menus (
  hotel_id, slug, title, list_label, list_schedule_summary, list_image_key,
  navigation_screen, confirm_screen, description, schedule_summary,
  header_image_key, juice_modal_title, sort_order
)
select
  h.id,
  m.slug,
  m.title,
  'Pokojová služba',
  m.list_schedule_summary,
  m.list_image_key,
  m.navigation_screen,
  m.confirm_screen,
  m.description,
  m.schedule_summary,
  m.header_image_key,
  'Džusy (300ml)',
  m.sort_order
from h
cross join (
  values
    (
      'snidane',
      'Snídaně',
      'Od 7:00 - Do 10:30',
      'breakfast',
      'SnidaneScreen',
      'ConfirmSnidaneScreen',
      'Objednejte si snídani přímo na pokoj a užijte si jídlo bez nutnosti opouštět pohodlí svého pokoje. Vyberte si z naší široké nabídky pokrmů, které vám doručíme čerstvé a připravené k okamžité konzumaci.',
      '07:00 - 10:30',
      'snidaneHeader',
      1
    ),
    (
      'obed',
      'Oběd',
      'Od 11:00 - Do 14:00',
      'lunch',
      'ObedScreen',
      'ConfirmObedScreen',
      'Objednejte si oběd přímo na pokoj a užijte si jídlo bez nutnosti opouštět pohodlí svého pokoje. Vyberte si z naší široké nabídky pokrmů, které vám doručíme čerstvé a připravené k okamžité konzumaci.',
      '11:00 - 14:00',
      'obedHeader',
      2
    ),
    (
      'vecere',
      'Večeře',
      'Od 18:00 - Do 22:00',
      'dinner',
      'VecereScreen',
      'ConfirmVecereScreen',
      'Objednejte si večeři přímo na pokoj a užijte si jídlo bez nutnosti opouštět pohodlí svého pokoje. Vyberte si z naší široké nabídky pokrmů, které vám doručíme čerstvé a připravené k okamžité konzumaci.',
      '18:00 - 22:00',
      'vecereHeader',
      3
    )
) as m (
  slug, title, list_schedule_summary, list_image_key, navigation_screen, confirm_screen,
  description, schedule_summary, header_image_key, sort_order
)
on conflict (slug) do update set
  title = excluded.title,
  list_schedule_summary = excluded.list_schedule_summary,
  list_image_key = excluded.list_image_key,
  navigation_screen = excluded.navigation_screen,
  confirm_screen = excluded.confirm_screen,
  description = excluded.description,
  schedule_summary = excluded.schedule_summary,
  header_image_key = excluded.header_image_key,
  sort_order = excluded.sort_order;

insert into public.hotel_room_service_hours (menu_id, day_order, day_name, hours_text)
select m.id, d.day_order, d.day_name, m.schedule_summary
from public.hotel_room_service_menus m
cross join (
  values
    (1, 'Pondělí'),
    (2, 'Úterý'),
    (3, 'Středa'),
    (4, 'Čtvrtek'),
    (5, 'Pátek'),
    (6, 'Sobota'),
    (7, 'Neděle')
) as d (day_order, day_name)
on conflict (menu_id, day_order) do update set hours_text = excluded.hours_text;

insert into public.hotel_room_service_categories (menu_id, slug, title, sort_order)
select m.id, c.slug, c.title, c.sort_order
from public.hotel_room_service_menus m
cross join (
  values
    ('snidane', 'napoje', 'Nápoje', 1),
    ('snidane', 'jidlo', 'Snídaně', 2),
    ('obed', 'napoje', 'Nápoje', 1),
    ('obed', 'jidlo', 'Oběd', 2),
    ('vecere', 'napoje', 'Nápoje', 1),
    ('vecere', 'jidlo', 'Večeře', 2)
) as c (menu_slug, slug, title, sort_order)
where m.slug = c.menu_slug
on conflict (menu_id, slug) do update set title = excluded.title;

insert into public.hotel_room_service_items (
  category_id, slug, name, description_short, icon_emoji, price_amount, requires_option, sort_order
)
select cat.id, i.slug, i.name, i.description_short, i.icon_emoji, i.price_amount, i.requires_option, i.sort_order
from public.hotel_room_service_categories cat
join public.hotel_room_service_menus m on m.id = cat.menu_id
cross join (
  values
    ('juice', 'Džusy', 'Pomerančový, jablečný, grepový', '🥤', 29.9, true, 1),
    ('cappuccino', 'Cappuccino', null, '☕', 39.9, false, 2),
    ('latte', 'Latte', null, '☕', 49.9, false, 3)
) as i (slug, name, description_short, icon_emoji, price_amount, requires_option, sort_order)
where cat.slug = 'napoje'
on conflict (category_id, slug) do update set
  name = excluded.name,
  description_short = excluded.description_short,
  price_amount = excluded.price_amount,
  requires_option = excluded.requires_option;

insert into public.hotel_room_service_item_options (item_id, slug, label, price_amount, sort_order)
select item.id, o.slug, o.label, o.price_amount, o.sort_order
from public.hotel_room_service_items item
join public.hotel_room_service_categories cat on cat.id = item.category_id
cross join (
  values
    ('pomerancovy', 'Pomerančový', 29.9, 1),
    ('jablecny', 'Jablečný', 29.9, 2),
    ('grepovy', 'Grepový', 29.9, 3)
) as o (slug, label, price_amount, sort_order)
where item.slug = 'juice' and cat.slug = 'napoje'
on conflict (item_id, slug) do update set
  label = excluded.label,
  price_amount = excluded.price_amount;

insert into public.hotel_room_service_items (
  category_id, slug, name, description_short, icon_emoji, price_amount, sort_order
)
select cat.id, i.slug, i.name, i.description_short, i.icon_emoji, i.price_amount, i.sort_order
from public.hotel_room_service_categories cat
join public.hotel_room_service_menus m on m.id = cat.menu_id
cross join (
  values
    ('omeleta', 'Omeleta', 'S cibulí, sýrem, šunkou, žampiony', '🍳', 129.9, 1),
    ('palacinky', 'Palačinky (4ks)', 'S Nutellou, džemem', '🥞', 79.9, 2),
    ('ovoce', 'Ovoce (200g)', 'Dle sezóny', '🍏', 59.9, 3),
    ('jogurt', 'Bílý nebo ochucený yougurt', 'Bílý, jahodový, čokoládový', '🥣', 24.9, 4),
    ('ovesne-vlocky', 'Ovesné vločky s mlékem', null, '🌾', 29.9, 5),
    ('vajicka', 'Vajíčka', 'Natvrdo, nahniličko, naměkko, volské oko', '🥚', 19.9, 6)
) as i (slug, name, description_short, icon_emoji, price_amount, sort_order)
where m.slug = 'snidane' and cat.slug = 'jidlo'
on conflict (category_id, slug) do update set
  name = excluded.name,
  description_short = excluded.description_short,
  price_amount = excluded.price_amount;

insert into public.hotel_room_service_items (
  category_id, slug, name, description_short, icon_emoji, price_amount, sort_order
)
select cat.id, i.slug, i.name, i.description_short, i.icon_emoji, i.price_amount, i.sort_order
from public.hotel_room_service_categories cat
join public.hotel_room_service_menus m on m.id = cat.menu_id
cross join (
  values
    ('hranolky', 'Hranolky (200g)', 'S kečupem, majonézou', '🍟', 89.9, 1),
    ('hranolky-velke', 'Hranolky (400g)', 'S kečupem, majonézou', '🍟', 149.9, 2),
    ('hranolky-extra', 'Hranolky (600g)', 'S kečupem, majonézou', '🍟', 199.9, 3)
) as i (slug, name, description_short, icon_emoji, price_amount, sort_order)
where m.slug = 'obed' and cat.slug = 'jidlo'
on conflict (category_id, slug) do update set
  name = excluded.name,
  price_amount = excluded.price_amount;

insert into public.hotel_room_service_items (
  category_id, slug, name, description_short, icon_emoji, price_amount, sort_order
)
select cat.id, i.slug, i.name, i.description_short, i.icon_emoji, i.price_amount, i.sort_order
from public.hotel_room_service_categories cat
join public.hotel_room_service_menus m on m.id = cat.menu_id
cross join (
  values
    ('hranolky', 'Hranolky (200g)', 'S kečupem, majonézou', '🍟', 89.9, 1),
    ('hranolky-velke', 'Hranolky (400g)', 'S kečupem, majonézou', '🍟', 149.9, 2),
    ('hranolky-extra', 'Hranolky (600g)', 'S kečupem, majonézou', '🍟', 199.9, 3)
) as i (slug, name, description_short, icon_emoji, price_amount, sort_order)
where m.slug = 'vecere' and cat.slug = 'jidlo'
on conflict (category_id, slug) do update set
  name = excluded.name,
  price_amount = excluded.price_amount;

-- -----------------------------------------------------------------------------
-- Pohled
-- -----------------------------------------------------------------------------

create or replace view public.hotel_room_service_export as
select
  m.slug as menu_slug,
  m.title,
  m.list_label,
  m.list_schedule_summary,
  m.list_image_key,
  m.navigation_screen,
  m.confirm_screen,
  m.description,
  m.schedule_summary,
  m.header_image_key,
  m.juice_modal_title,
  m.sort_order,
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
      from public.hotel_room_service_hours h
      where h.menu_id = m.id
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
                  'name', i.name,
                  'description_short', i.description_short,
                  'icon_emoji', i.icon_emoji,
                  'price_amount', i.price_amount,
                  'requires_option', i.requires_option,
                  'sort_order', i.sort_order,
                  'options', (
                    select coalesce(
                      json_agg(
                        json_build_object(
                          'slug', o.slug,
                          'label', o.label,
                          'price_amount', o.price_amount,
                          'sort_order', o.sort_order
                        )
                        order by o.sort_order
                      ),
                      '[]'::json
                    )
                    from public.hotel_room_service_item_options o
                    where o.item_id = i.id
                  )
                )
                order by i.sort_order
              ),
              '[]'::json
            )
            from public.hotel_room_service_items i
            where i.category_id = cat.id and i.is_available
          )
        )
        order by cat.sort_order
      )
      from public.hotel_room_service_categories cat
      where cat.menu_id = m.id
    ),
    '[]'::json
  ) as categories
from public.hotel_room_service_menus m
where m.is_active
order by m.sort_order;

grant select on public.hotel_room_service_export to anon, authenticated;
