-- =============================================================================
-- OtelApps — Provozní Úkoly (vrstva nad hotel_service_requests)
-- Spusť v Supabase SQL Editoru.
-- =============================================================================

-- Fronty tiketů
create table if not exists public.hotel_ticket_queues (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  key text not null,
  label text not null,
  color text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (hotel_id, key)
);

comment on table public.hotel_ticket_queues is
  'Provozní fronty tiketů (úklid, donáška, údržba, …).';

-- Rozšíření service requests o provozní pole
alter table public.hotel_service_requests
  add column if not exists queue_key text,
  add column if not exists due_at timestamptz,
  add column if not exists claimed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists assigned_user_id bigint,
  add column if not exists assigned_user_name text,
  add column if not exists created_by_user_id bigint,
  add column if not exists created_by_label text;

create index if not exists idx_hsr_hotel_queue_status
  on public.hotel_service_requests (hotel_id, queue_key, status, created_at desc);

create index if not exists idx_hsr_assigned_user
  on public.hotel_service_requests (hotel_id, assigned_user_id)
  where assigned_user_id is not null;

-- Timeline událostí tiketu
create table if not exists public.hotel_ticket_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.hotel_service_requests (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'created', 'queued', 'claimed', 'reassigned', 'note',
      'status_changed', 'priority_changed', 'due_changed', 'completed'
    )
  ),
  body text,
  actor_user_id bigint,
  actor_label text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hotel_ticket_events_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hte_request_created
  on public.hotel_ticket_events (request_id, created_at asc);

-- Seed front pro hotel default
with h as (
  select id from public.hotels where slug = 'default' limit 1
)
insert into public.hotel_ticket_queues (hotel_id, key, label, color, sort_order)
select h.id, q.key, q.label, q.color, q.sort_order
from h
cross join (values
  ('housekeeping', 'Úklid', '#2563eb', 10),
  ('room_delivery', 'Donáška do pokoje', '#7c3aed', 20),
  ('maintenance', 'Údržba', '#dc2626', 30),
  ('reception', 'Recepce', '#ea580c', 40),
  ('other', 'Ostatní', '#64748b', 50)
) as q(key, label, color, sort_order)
on conflict (hotel_id, key) do nothing;

-- Backfill queue_key z service_module
update public.hotel_service_requests
set queue_key = case
  when service_module in ('laundry', 'housekeeping') then 'housekeeping'
  when service_module in ('amenities', 'room_service', 'supplies') then 'room_delivery'
  when service_module in ('issues_repairs', 'maintenance') then 'maintenance'
  when service_module in ('check_in_out', 'reception') then 'reception'
  else 'other'
end
where queue_key is null;

-- Synchronizace assigned_user_name ze starého assigned_staff_name
update public.hotel_service_requests
set assigned_user_name = assigned_staff_name
where assigned_user_name is null
  and assigned_staff_name is not null
  and assigned_staff_name <> '';

-- Základní created eventy pro existující requesty bez timeline
insert into public.hotel_ticket_events (request_id, event_type, body, actor_label, created_at)
select r.id, 'created', 'Úkol vytvořen', coalesce(r.created_by_label, 'system'), r.created_at
from public.hotel_service_requests r
where not exists (
  select 1 from public.hotel_ticket_events e
  where e.request_id = r.id and e.event_type = 'created'
);
