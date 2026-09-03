-- =============================================================================
-- OtelApps WebAdmin — per-hotel zapnutí modulů
-- Spusť v Supabase SQL Editoru
-- =============================================================================

create table if not exists public.hotel_module_settings (
  hotel_id uuid primary key references public.hotels (id) on delete cascade,
  enabled_modules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.hotel_module_settings is
  'Partial override modulů (klíč → bool). Chybějící klíče berou default z config/modules.php.';

alter table public.hotel_module_settings enable row level security;

drop policy if exists hotel_module_settings_public_read on public.hotel_module_settings;
create policy hotel_module_settings_public_read
  on public.hotel_module_settings
  for select
  to anon, authenticated
  using (true);

-- Seed pro demo hotel — stejné defaulty jako config/modules.php
insert into public.hotel_module_settings (hotel_id, enabled_modules)
select id, '{
  "recepce": true,
  "ukoly": true,
  "finance": true,
  "dashboard": true,
  "content": true,
  "my_app": false,
  "activity": true,
  "crm": true,
  "feedback": true,
  "concierge": true,
  "insights": true,
  "facilities": true,
  "services": true,
  "leisure": true,
  "other": true,
  "welcome_message": true,
  "smart_assistant": true,
  "legal_texts": true,
  "mobile_app": true,
  "web_app": true,
  "requests": true,
  "guests": true,
  "alerts": true,
  "promotions": true,
  "tasks": true,
  "history": true,
  "surveys": true,
  "surveys_welcome": true,
  "surveys_generic": true,
  "surveys_facilities": true,
  "surveys_checkout": true,
  "external_platforms": true,
  "inbox": true,
  "stats": true,
  "users": true,
  "transactions": true,
  "revenue": true,
  "behavior": true,
  "staff": true,
  "finance_overview": true,
  "finance_closings": true,
  "finance_transactions": true,
  "finance_deposits": true,
  "finance_reports": true,
  "restaurants_bars": true,
  "relax_sport": false,
  "wellness_spa": true,
  "sports": true,
  "other_facilities": true,
  "hotel_info": true,
  "hotel_rooms": true,
  "parking": true,
  "places_of_interest": true,
  "transportation": true,
  "where_to_go": true,
  "generic_other": true,
  "required_content": true,
  "room_service": true,
  "amenities": true,
  "laundry": true,
  "issues_repairs": true,
  "check_in_out": true,
  "booking_system": true,
  "concierge_chat": true,
  "upsell": true,
  "image_gallery": true,
  "menu_editor": true,
  "qr_code": true,
  "web_app_access": true
}'::jsonb
from public.hotels
where slug = 'default'
on conflict (hotel_id) do nothing;
