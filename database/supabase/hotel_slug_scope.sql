-- =============================================================================
-- OtelApps — slug unique per hotel (ne globálně)
-- Spusť v Supabase SQL Editoru po hotel_module_settings.sql
-- =============================================================================

-- venues
alter table public.venues drop constraint if exists venues_slug_key;
alter table public.venues drop constraint if exists venues_slug_unique;
create unique index if not exists venues_hotel_id_slug_key on public.venues (hotel_id, slug);

-- wellness_facilities
alter table public.wellness_facilities drop constraint if exists wellness_facilities_slug_key;
alter table public.wellness_facilities drop constraint if exists wellness_facilities_slug_unique;
create unique index if not exists wellness_facilities_hotel_id_slug_key
  on public.wellness_facilities (hotel_id, slug);

-- hotel_info_topics
alter table public.hotel_info_topics drop constraint if exists hotel_info_topics_slug_key;
alter table public.hotel_info_topics drop constraint if exists hotel_info_topics_slug_unique;
create unique index if not exists hotel_info_topics_hotel_id_slug_key
  on public.hotel_info_topics (hotel_id, slug);

-- hotel_room_types
alter table public.hotel_room_types drop constraint if exists hotel_room_types_slug_key;
alter table public.hotel_room_types drop constraint if exists hotel_room_types_slug_unique;
create unique index if not exists hotel_room_types_hotel_id_slug_key
  on public.hotel_room_types (hotel_id, slug);

-- hotel_parking_topics
alter table public.hotel_parking_topics drop constraint if exists hotel_parking_topics_slug_key;
alter table public.hotel_parking_topics drop constraint if exists hotel_parking_topics_slug_unique;
create unique index if not exists hotel_parking_topics_hotel_id_slug_key
  on public.hotel_parking_topics (hotel_id, slug);

-- hotel_room_service_menus
alter table public.hotel_room_service_menus drop constraint if exists hotel_room_service_menus_slug_key;
alter table public.hotel_room_service_menus drop constraint if exists hotel_room_service_menus_slug_unique;
create unique index if not exists hotel_room_service_menus_hotel_id_slug_key
  on public.hotel_room_service_menus (hotel_id, slug);

-- fitness_facilities
alter table public.fitness_facilities drop constraint if exists fitness_facilities_slug_key;
alter table public.fitness_facilities drop constraint if exists fitness_facilities_slug_unique;
create unique index if not exists fitness_facilities_hotel_id_slug_key
  on public.fitness_facilities (hotel_id, slug);
