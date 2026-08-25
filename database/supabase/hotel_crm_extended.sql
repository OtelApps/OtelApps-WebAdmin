-- =============================================================================
-- OtelApps CRM — rozšíření (úkoly, historie, GDPR, pobyt, věrnost)
-- Spusť PO hotel_crm.sql v Supabase SQL Editoru
-- =============================================================================

alter table public.hotel_crm_guest_profiles
  add column if not exists check_in_at timestamptz,
  add column if not exists check_out_at timestamptz,
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists loyalty_points int not null default 0 check (loyalty_points >= 0),
  add column if not exists stay_count int not null default 0 check (stay_count >= 0),
  add column if not exists assigned_staff_name text,
  add column if not exists company_name text,
  add column if not exists nationality text;

create table if not exists public.hotel_crm_tasks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_key text,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  task_type text not null default 'follow_up' check (
    task_type in ('follow_up', 'call', 'email', 'checkout', 'vip_service', 'other')
  ),
  assigned_staff_name text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hcrm_tasks_hotel_status
  on public.hotel_crm_tasks (hotel_id, status, due_at nulls last);

create table if not exists public.hotel_crm_interactions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_key text,
  channel text not null default 'note' check (
    channel in ('note', 'phone', 'email', 'reception', 'whatsapp', 'sms', 'in_person')
  ),
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound', 'internal')),
  subject text not null,
  body text,
  staff_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hcrm_interactions_hotel_created
  on public.hotel_crm_interactions (hotel_id, created_at desc);

-- Demo úkoly a interakce: spusť reset_demo_guests.sql a vytvoř je ručně v CRM, pokud potřebuješ.
