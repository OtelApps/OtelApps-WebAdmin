-- =============================================================================
-- OtelApps — CRM (hosté, alerty, promo akce)
-- Spusť v Supabase SQL Editoru. Předpoklad: public.hotels existuje.
-- WebAdmin: Laravel API /api/crm/*
-- =============================================================================

create table if not exists public.hotel_crm_guest_profiles (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_key text not null,
  guest_external_id text,
  display_name text,
  room_number text,
  email text,
  phone text,
  locale text default 'cs',
  segment text not null default 'standard' check (
    segment in ('standard', 'vip', 'corporate', 'returning')
  ),
  tags jsonb not null default '[]'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_crm_guest_profiles_tags_is_array check (jsonb_typeof(tags) = 'array'),
  constraint hotel_crm_guest_profiles_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists idx_hcrm_guest_hotel_key
  on public.hotel_crm_guest_profiles (hotel_id, guest_key);

create table if not exists public.hotel_crm_alerts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_key text,
  alert_type text not null default 'manual' check (
    alert_type in ('manual', 'open_request', 'unread_chat', 'vip_attention', 'promotion')
  ),
  severity text not null default 'info' check (
    severity in ('info', 'warning', 'critical')
  ),
  title text not null,
  body text,
  status text not null default 'active' check (
    status in ('active', 'dismissed', 'resolved')
  ),
  source_module text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_hcrm_alerts_hotel_status
  on public.hotel_crm_alerts (hotel_id, status, created_at desc);

create table if not exists public.hotel_crm_promotions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  title text not null,
  subtitle text,
  body text,
  cta_label text,
  cta_url text,
  image_url text,
  segment text not null default 'all' check (
    segment in ('all', 'standard', 'vip', 'corporate', 'returning')
  ),
  channels jsonb not null default '["mobile_app"]'::jsonb,
  status text not null default 'draft' check (
    status in ('draft', 'scheduled', 'active', 'ended')
  ),
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_crm_promotions_channels_is_array check (jsonb_typeof(channels) = 'array')
);

create index if not exists idx_hcrm_promotions_hotel_status
  on public.hotel_crm_promotions (hotel_id, status, starts_at desc nulls last);

-- Seed demo profilů a promo (hotel default)
with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_crm_guest_profiles (
  hotel_id, guest_key, guest_external_id, display_name, room_number, locale, segment, tags, notes
)
select h.id, v.guest_key, v.guest_external_id, v.display_name, v.room_number, v.locale, v.segment, v.tags::jsonb, v.notes
from h
cross join (
  values
    ('ext:guest-marc-201', 'guest-marc-201', 'Marc Dubois', '201', 'fr', 'vip', '["spa","restaurant"]', 'Preferuje večeře v 20:00'),
    ('ext:guest-anna-415', 'guest-anna-415', 'Anna K.', '415', 'cs', 'returning', '["sport"]', 'Opakovaný host — tenis')
) as v(guest_key, guest_external_id, display_name, room_number, locale, segment, tags, notes)
where not exists (
  select 1 from public.hotel_crm_guest_profiles p where p.guest_key = v.guest_key
);

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_crm_promotions (
  hotel_id, title, subtitle, body, cta_label, segment, status, starts_at, ends_at, channels
)
select
  h.id,
  v.title,
  v.subtitle,
  v.body,
  v.cta_label,
  v.segment,
  v.status,
  v.starts_at::timestamptz,
  v.ends_at::timestamptz,
  v.channels::jsonb
from h
cross join (
  values
    (
      'Wellness víkend −15 %',
      'Pouze pro hosty v hotelu',
      'Rezervujte proceduru ve spa do neděle a získejte slevu 15 %.',
      'Rezervovat',
      'all',
      'active',
      now() - interval '1 day',
      now() + interval '14 days',
      '["mobile_app","web_app"]'
    ),
    (
      'VIP welcome drink',
      'Exkluzivně pro VIP hosty',
      'Při příští večeři v hotelové restauraci welcome drink zdarma.',
      'Zobrazit v app',
      'vip',
      'scheduled',
      now() + interval '2 days',
      now() + interval '30 days',
      '["mobile_app"]'
    )
) as v(title, subtitle, body, cta_label, segment, status, starts_at, ends_at, channels)
where not exists (
  select 1 from public.hotel_crm_promotions p where p.title = v.title
);
