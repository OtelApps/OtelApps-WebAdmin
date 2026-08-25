-- =============================================================================
-- OtelApps — Automatické přiřazení fronty tiketu podle typu služby
-- Spusť v Supabase SQL Editoru (nebo přes supabase db push).
-- =============================================================================

-- Kam který modul patří (přepisuje výchozí mapování v config/permissions.php)
alter table public.hotel_service_request_types
  add column if not exists queue_key text;

comment on column public.hotel_service_request_types.queue_key is
  'Fronta tiketů (hotel_ticket_queues.key), do které se automaticky zařadí nový požadavek tohoto typu.';

-- Výchozí mapování service_module → queue_key
update public.hotel_service_request_types
set queue_key = case module_key
  when 'laundry' then 'housekeeping'
  when 'housekeeping' then 'housekeeping'
  when 'amenities' then 'room_delivery'
  when 'supplies' then 'room_delivery'
  when 'room_service' then 'room_delivery'
  when 'issues_repairs' then 'maintenance'
  when 'maintenance' then 'maintenance'
  when 'check_in_out' then 'reception'
  when 'reception' then 'reception'
  else 'other'
end
where queue_key is null or btrim(queue_key) = '';

create or replace function public.resolve_ticket_queue_key(
  p_hotel_id uuid,
  p_service_module text
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_queue text;
begin
  if p_hotel_id is not null and coalesce(trim(p_service_module), '') <> '' then
    select nullif(trim(t.queue_key), '')
      into v_queue
    from public.hotel_service_request_types t
    where t.hotel_id = p_hotel_id
      and t.module_key = p_service_module
      and t.is_active = true
    limit 1;
  end if;

  if v_queue is not null then
    return v_queue;
  end if;

  return case p_service_module
    when 'laundry' then 'housekeeping'
    when 'housekeeping' then 'housekeeping'
    when 'amenities' then 'room_delivery'
    when 'supplies' then 'room_delivery'
    when 'room_service' then 'room_delivery'
    when 'issues_repairs' then 'maintenance'
    when 'maintenance' then 'maintenance'
    when 'check_in_out' then 'reception'
    when 'reception' then 'reception'
    else 'other'
  end;
end;
$$;

create or replace function public.assign_service_request_queue_key()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.queue_key is null or btrim(new.queue_key) = '' then
    new.queue_key := public.resolve_ticket_queue_key(new.hotel_id, new.service_module);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_hotel_service_requests_assign_queue on public.hotel_service_requests;
create trigger trg_hotel_service_requests_assign_queue
  before insert on public.hotel_service_requests
  for each row
  execute procedure public.assign_service_request_queue_key();

-- RPC z mobilu — stejná signatura, navíc plní queue_key
create or replace function public.create_guest_service_request(
  p_hotel_slug text,
  p_service_module text,
  p_service_label text,
  p_service_icon text,
  p_request_text text,
  p_guest_display_name text,
  p_room_number text,
  p_guest_external_id text,
  p_guest_locale text default 'cs',
  p_status_guest_note text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_source_entity_type text default null,
  p_source_entity_slug text default null,
  p_guest_email text default null,
  p_guest_phone text default null
)
returns table (id uuid, request_number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
begin
  select h.id into v_hotel_id
  from public.hotels h
  where h.slug = p_hotel_slug;

  if v_hotel_id is null then
    raise exception 'Hotel "%" nenalezen.', p_hotel_slug;
  end if;

  return query
  insert into public.hotel_service_requests (
    hotel_id,
    service_module,
    service_label,
    service_icon,
    request_text,
    guest_display_name,
    room_number,
    guest_external_id,
    guest_locale,
    guest_email,
    guest_phone,
    status_guest_note,
    metadata,
    source_entity_type,
    source_entity_slug,
    created_via,
    queue_key
  )
  values (
    v_hotel_id,
    p_service_module,
    p_service_label,
    p_service_icon,
    p_request_text,
    p_guest_display_name,
    p_room_number,
    p_guest_external_id,
    coalesce(p_guest_locale, 'cs'),
    nullif(trim(p_guest_email), ''),
    nullif(trim(p_guest_phone), ''),
    nullif(trim(p_status_guest_note), ''),
    coalesce(p_metadata, '{}'::jsonb),
    p_source_entity_type,
    p_source_entity_slug,
    'mobile_app',
    public.resolve_ticket_queue_key(v_hotel_id, p_service_module)
  )
  returning hotel_service_requests.id, hotel_service_requests.request_number;
end;
$$;

grant execute on function public.create_guest_service_request(
  text, text, text, text, text, text, text, text, text, text, jsonb, text, text, text, text
) to anon, authenticated;

-- Doplnit frontu u existujících tiketů bez queue_key
update public.hotel_service_requests r
set queue_key = public.resolve_ticket_queue_key(r.hotel_id, r.service_module)
where r.queue_key is null or btrim(r.queue_key) = '';

notify pgrst, 'reload schema';
