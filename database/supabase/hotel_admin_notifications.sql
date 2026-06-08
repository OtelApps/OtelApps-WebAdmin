-- =============================================================================
-- OtelApps WebAdmin — notifikace (nastavení + feed)
-- Spusť v Supabase SQL Editoru
-- =============================================================================

create table if not exists public.hotel_admin_notification_settings (
  hotel_id uuid primary key references public.hotels (id) on delete cascade,
  preferences jsonb not null default '{
    "activity_enabled": true,
    "activity_statuses": ["new"],
    "concierge_enabled": true,
    "toast_enabled": true,
    "browser_notifications": true,
    "sound_enabled": false,
    "poll_interval_seconds": 15
  }'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.hotel_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  source text not null check (source in ('activity', 'concierge')),
  source_id text not null,
  title text not null,
  body text,
  link_path text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_han_hotel_unread
  on public.hotel_admin_notifications (hotel_id, created_at desc)
  where read_at is null;

create unique index if not exists idx_han_hotel_source
  on public.hotel_admin_notifications (hotel_id, source, source_id);

-- Výchozí nastavení pro demo hotel
insert into public.hotel_admin_notification_settings (hotel_id)
select id from public.hotels where slug = 'default'
on conflict (hotel_id) do nothing;
