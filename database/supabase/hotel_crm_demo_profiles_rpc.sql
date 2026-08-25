-- =============================================================================
-- OtelApps — CRM profil hosta z mobilní app + email/telefon u service requestů
-- Spusť v Supabase SQL Editoru (nebo přes supabase db push).
-- =============================================================================

-- Rozšíření RPC pro service requesty (email + telefon hosta)
drop function if exists public.create_guest_service_request(
  text, text, text, text, text, text, text, text, text, text, jsonb, text, text
);

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
    created_via
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
    'mobile_app'
  )
  returning hotel_service_requests.id, hotel_service_requests.request_number;
end;
$$;

grant execute on function public.create_guest_service_request(
  text, text, text, text, text, text, text, text, text, text, jsonb, text, text, text, text
) to anon, authenticated;

-- Upsert CRM profilu hosta (mobilní demo login)
create or replace function public.upsert_guest_crm_profile(
  p_hotel_slug text,
  p_guest_external_id text,
  p_display_name text,
  p_room_number text,
  p_email text default null,
  p_phone text default null,
  p_locale text default 'cs',
  p_segment text default 'standard',
  p_check_in_at timestamptz default null,
  p_check_out_at timestamptz default null,
  p_marketing_consent boolean default false,
  p_loyalty_points int default 0,
  p_stay_count int default 0,
  p_assigned_staff_name text default null,
  p_company_name text default null,
  p_nationality text default null,
  p_reservation_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_guest_key text;
  v_profile_id uuid;
  v_metadata jsonb;
begin
  select h.id into v_hotel_id
  from public.hotels h
  where h.slug = p_hotel_slug;

  if v_hotel_id is null then
    raise exception 'Hotel "%" nenalezen.', p_hotel_slug;
  end if;

  if coalesce(trim(p_guest_external_id), '') = '' then
    raise exception 'guest_external_id je povinný.';
  end if;

  v_guest_key := 'ext:' || trim(p_guest_external_id);
  v_metadata := case
    when coalesce(trim(p_reservation_number), '') <> '' then
      jsonb_build_object('reservation_number', trim(p_reservation_number))
    else '{}'::jsonb
  end;

  insert into public.hotel_crm_guest_profiles (
    hotel_id,
    guest_key,
    guest_external_id,
    display_name,
    room_number,
    email,
    phone,
    locale,
    segment,
    check_in_at,
    check_out_at,
    marketing_consent,
    marketing_consent_at,
    loyalty_points,
    stay_count,
    assigned_staff_name,
    company_name,
    nationality,
    metadata,
    updated_at
  )
  values (
    v_hotel_id,
    v_guest_key,
    trim(p_guest_external_id),
    nullif(trim(p_display_name), ''),
    nullif(trim(p_room_number), ''),
    nullif(trim(p_email), ''),
    nullif(trim(p_phone), ''),
    coalesce(nullif(trim(p_locale), ''), 'cs'),
    coalesce(nullif(trim(p_segment), ''), 'standard'),
    p_check_in_at,
    p_check_out_at,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end,
    greatest(coalesce(p_loyalty_points, 0), 0),
    greatest(coalesce(p_stay_count, 0), 0),
    nullif(trim(p_assigned_staff_name), ''),
    nullif(trim(p_company_name), ''),
    nullif(trim(p_nationality), ''),
    v_metadata,
    now()
  )
  on conflict (hotel_id, guest_key) do update set
    guest_external_id = excluded.guest_external_id,
    display_name = excluded.display_name,
    room_number = excluded.room_number,
    email = excluded.email,
    phone = excluded.phone,
    locale = excluded.locale,
    segment = excluded.segment,
    check_in_at = excluded.check_in_at,
    check_out_at = excluded.check_out_at,
    marketing_consent = excluded.marketing_consent,
    marketing_consent_at = case
      when excluded.marketing_consent and hotel_crm_guest_profiles.marketing_consent_at is null then now()
      when not excluded.marketing_consent then null
      else hotel_crm_guest_profiles.marketing_consent_at
    end,
    loyalty_points = excluded.loyalty_points,
    stay_count = excluded.stay_count,
    assigned_staff_name = excluded.assigned_staff_name,
    company_name = excluded.company_name,
    nationality = excluded.nationality,
    metadata = hotel_crm_guest_profiles.metadata || excluded.metadata,
    updated_at = now()
  returning id into v_profile_id;

  return v_profile_id;
end;
$$;

grant execute on function public.upsert_guest_crm_profile(
  text, text, text, text, text, text, text, text, timestamptz, timestamptz,
  boolean, int, int, text, text, text, text
) to anon, authenticated;

-- Seed 4 demo profilů (idempotentní)
with h as (select id from public.hotels where slug = 'default')
insert into public.hotel_crm_guest_profiles (
  hotel_id,
  guest_key,
  guest_external_id,
  display_name,
  room_number,
  email,
  phone,
  locale,
  segment,
  check_in_at,
  check_out_at,
  marketing_consent,
  marketing_consent_at,
  loyalty_points,
  stay_count,
  assigned_staff_name,
  company_name,
  nationality,
  metadata
)
select
  h.id,
  v.guest_key,
  v.guest_external_id,
  v.display_name,
  v.room_number,
  v.email,
  v.phone,
  v.locale,
  v.segment,
  v.check_in_at::timestamptz,
  v.check_out_at::timestamptz,
  v.marketing_consent,
  case when v.marketing_consent then now() else null end,
  v.loyalty_points,
  v.stay_count,
  v.assigned_staff_name,
  nullif(v.company_name, ''),
  v.nationality,
  jsonb_build_object('reservation_number', v.reservation_number)
from h
cross join (
  values
    (
      'ext:demo-a1001-vetiska', 'demo-a1001-vetiska', 'Michal Vetiška', '101', 'A1001',
      'michal.vetiska@demo.otelapps.test', '+420 601 100 101', 'cs', 'standard',
      '2026-07-09', '2026-07-12', false, 0, 1, 'Recepce', '', 'CZ'
    ),
    (
      'ext:demo-b2002-kratky', 'demo-b2002-kratky', 'Michal Krátký', '202', 'B2002',
      'michal.kratky@demo.otelapps.test', '+420 602 200 202', 'cs', 'returning',
      '2026-07-15', '2026-07-18', true, 40, 3, 'Concierge', '', 'CZ'
    ),
    (
      'ext:demo-c3003-milt', 'demo-c3003-milt', 'Lukáš Milt', '315', 'C3003',
      'lukas.milt@demo.otelapps.test', '+420 603 300 315', 'en', 'vip',
      '2026-07-21', '2026-07-24', true, 120, 7, 'Concierge', '', 'CZ'
    ),
    (
      'ext:demo-d4004-riha', 'demo-d4004-riha', 'Vojta Říha', '408', 'D4004',
      'vojta.riha@demo.otelapps.test', '+420 604 400 408', 'de', 'corporate',
      '2026-07-27', '2026-07-30', false, 25, 2, 'Recepce', 'ACME Corp s.r.o.', 'CZ'
    )
) as v(
  guest_key, guest_external_id, display_name, room_number, reservation_number,
  email, phone, locale, segment, check_in_at, check_out_at,
  marketing_consent, loyalty_points, stay_count, assigned_staff_name, company_name, nationality
)
where not exists (
  select 1 from public.hotel_crm_guest_profiles p
  where p.hotel_id = h.id and p.guest_key = v.guest_key
);

notify pgrst, 'reload schema';
