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

-- Demo úkol + interakce
with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_crm_tasks (
  hotel_id, guest_key, title, description, status, priority, task_type, assigned_staff_name, due_at
)
select h.id, 'ext:guest-marc-201', v.title, v.description, v.status, v.priority, v.task_type, v.assigned, v.due_at::timestamptz
from h
cross join (
  values
    ('Zavolat ohledně rezervace stolu', 'Potvrdit večeři v 20:00', 'open', 'high', 'call', 'Recepce', now() + interval '2 hours'),
    ('VIP welcome amenity', 'Připravit welcome drink do pokoje 201', 'open', 'normal', 'vip_service', 'Concierge', now() + interval '1 day')
) as v(title, description, status, priority, task_type, assigned, due_at)
where not exists (select 1 from public.hotel_crm_tasks t where t.title = v.title);

with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_crm_interactions (hotel_id, guest_key, channel, direction, subject, body, staff_name)
select h.id, v.guest_key, v.channel, v.direction, v.subject, v.body, v.staff
from h
cross join (
  values
    ('ext:guest-anna-415', 'phone', 'inbound', 'Dotaz na tenisový kurt', 'Host chtěl rezervovat kurt na zítra 10:00', 'Recepce'),
    ('ext:guest-marc-201', 'reception', 'inbound', 'Dotaz na spa', 'Informace o otevírací době wellness', 'Recepce')
) as v(guest_key, channel, direction, subject, body, staff)
where not exists (select 1 from public.hotel_crm_interactions i where i.subject = v.subject);

update public.hotel_crm_guest_profiles
set
  check_in_at = coalesce(check_in_at, now() - interval '1 day'),
  check_out_at = coalesce(check_out_at, now() + interval '2 days'),
  marketing_consent = true,
  marketing_consent_at = coalesce(marketing_consent_at, now()),
  loyalty_points = case when segment = 'vip' then 120 else 40 end,
  stay_count = case when segment = 'returning' then 3 else 1 end,
  assigned_staff_name = 'Recepce',
  preferences = '{"diet":"vegetarian","pillow":"extra soft"}'::jsonb
where guest_key in ('ext:guest-marc-201', 'ext:guest-anna-415');
