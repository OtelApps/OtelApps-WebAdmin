-- =============================================================================
-- OtelApps WebAdmin — YAML profil hotelu v DB (HQ)
-- Spusť v Supabase SQL Editoru
-- =============================================================================

create table if not exists public.hotel_profiles (
  hotel_id uuid primary key references public.hotels (id) on delete cascade,
  app_name text not null default '',
  admin_url text not null default '',
  web_url text not null default '',
  lat numeric(9, 6),
  lng numeric(9, 6),
  admin_email text not null default '',
  app_store_url text not null default '',
  play_store_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.hotel_profiles is
  'Per-hotel branding, URL a geo. Zdroj pravdy pro HQ; YAML je šablona/export.';

alter table public.hotel_profiles enable row level security;

drop policy if exists hotel_profiles_public_read on public.hotel_profiles;
create policy hotel_profiles_public_read
  on public.hotel_profiles
  for select
  to anon, authenticated
  using (true);
