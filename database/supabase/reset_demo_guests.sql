-- =============================================================================
-- OtelApps — reset hostů: smaže všechny demo/test záznamy a vytvoří 4 testovací účty
-- Spusť v Supabase SQL Editoru (hotel slug = default).
--
-- Testovací účty:
--   Michal Vetiška  (A1001 / Vetiska / pokoj 101)
--   Michal Krátký   (B2002 / Kratky  / pokoj 202)
--   Lukáš Milt      (C3003 / Milt    / pokoj 315)
--   Vojta Říha      (D4004 / Riha    / pokoj 408)
-- =============================================================================

do $$
declare
  v_hotel_id uuid;
begin
  select id into v_hotel_id from public.hotels where slug = 'default';
  if v_hotel_id is null then
    raise exception 'Hotel "default" nenalezen.';
  end if;

  -- Status logy požadavků
  delete from public.hotel_service_request_status_logs
  where request_id in (
    select id from public.hotel_service_requests where hotel_id = v_hotel_id
  );

  -- Požadavky hostů
  delete from public.hotel_service_requests where hotel_id = v_hotel_id;

  -- Chat
  delete from public.hotel_concierge_messages
  where conversation_id in (
    select id from public.hotel_concierge_conversations where hotel_id = v_hotel_id
  );

  delete from public.hotel_concierge_conversations where hotel_id = v_hotel_id;

  -- CRM
  delete from public.hotel_crm_interactions where hotel_id = v_hotel_id;
  delete from public.hotel_crm_tasks where hotel_id = v_hotel_id;
  delete from public.hotel_crm_alerts where hotel_id = v_hotel_id;
  delete from public.hotel_crm_guest_profiles where hotel_id = v_hotel_id;
end $$;

-- 4 testovací CRM profily
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
);

notify pgrst, 'reload schema';
