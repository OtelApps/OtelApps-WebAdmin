-- =============================================================================
-- OtelApps — 10 dalších CRM hostů (jen CRM / recepce, NE login účty)
-- Login demo účty (Vetiška, Krátký, Milt, Říha) se nemění.
-- Spusť v Supabase SQL Editoru.
-- =============================================================================

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
  jsonb_build_object('source', 'crm_only', 'reservation_number', v.reservation_number)
from h
cross join (
  values
    ('crm:novak-petr', null::text, 'Novák, Petr', '201', 'R-5001',
     'petr.novak@email.cz', '+420 602 111 201', 'cs', 'standard',
     now() - interval '2 days', now() + interval '2 days', false, 0, 1, 'Recepce', '', 'CZ'),
    ('crm:svobodova-eva', null, 'Svobodová, Eva', '203', 'R-5002',
     'eva.svobodova@email.cz', '+420 777 555 203', 'cs', 'returning',
     now() - interval '1 day', now() + interval '3 days', true, 15, 2, 'Recepce', '', 'CZ'),
    ('crm:dvorak-tomas', null, 'Dvořák, Tomáš', '204', 'R-5003',
     'tomas.dvorak@email.cz', '+420 603 444 204', 'cs', 'standard',
     now() - interval '3 days', now() + interval '1 day', false, 0, 1, 'Recepce', '', 'CZ'),
    ('crm:benesova-lucie', null, 'Benešová, Lucie', '214', 'R-5004',
     'lucie.benesova@email.cz', '+420 608 999 214', 'en', 'vip',
     now() - interval '4 days', now() + interval '2 days', true, 80, 4, 'Concierge', '', 'SK'),
    ('crm:horak-jiri', null, 'Horák, Jiří', '102', 'R-5005',
     'jiri.horak@email.cz', '+420 775 222 102', 'cs', 'standard',
     now() - interval '1 day', now() + interval '4 days', false, 5, 1, 'Recepce', '', 'CZ'),
    ('crm:cerny-pavel', null, 'Černý, Pavel', '104', 'R-5006',
     'pavel.cerny@email.cz', '+420 606 777 104', 'cs', 'corporate',
     now() - interval '2 days', now() + interval '3 days', true, 20, 2, 'Recepce', 'SoftTech s.r.o.', 'CZ'),
    ('crm:prochazkova-anna', null, 'Procházková, Anna', '106', 'R-5007',
     'anna.prochazkova@email.cz', '+420 702 111 106', 'cs', 'returning',
     now() - interval '5 days', now() + interval '1 day', true, 35, 3, 'Concierge', '', 'CZ'),
    ('crm:marek-ondrej', null, 'Marek, Ondřej', '002', 'R-5008',
     'ondrej.marek@email.cz', '+420 731 555 002', 'de', 'standard',
     now() - interval '1 day', now() + interval '2 days', false, 0, 1, 'Recepce', '', 'AT'),
    ('crm:kralova-tereza', null, 'Králová, Tereza', '004', 'R-5009',
     'tereza.kralova@email.cz', '+420 721 888 004', 'cs', 'vip',
     now() - interval '2 days', now() + interval '5 days', true, 150, 6, 'Concierge', '', 'CZ'),
    ('crm:urban-filip', null, 'Urban, Filip', '205', 'R-5010',
     'filip.urban@email.cz', '+420 605 333 205', 'en', 'corporate',
     now() - interval '3 days', now() + interval '2 days', false, 10, 2, 'Recepce', 'Nordic Labs', 'PL')
) as v(
  guest_key, guest_external_id, display_name, room_number, reservation_number,
  email, phone, locale, segment, check_in_at, check_out_at,
  marketing_consent, loyalty_points, stay_count, assigned_staff_name, company_name, nationality
)
where not exists (
  select 1
  from public.hotel_crm_guest_profiles p
  where p.hotel_id = h.id and p.guest_key = v.guest_key
);
