-- Doplní Unsplash fotky do image_* sloupců, kde je jen lokální klíč (ne URL).
-- Stejné fotky používá HostWebClient i mobilní appka.

create temporary table image_key_urls (
  k text primary key,
  url text not null
);

insert into image_key_urls (k, url) values
  ('bowling', 'https://images.unsplash.com/photo-1546443046-ed1ce6ffd1ab?auto=format&fit=crop&w=1400&q=80'),
  ('buffet', 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=80'),
  ('reception', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'),
  ('lobby', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80'),
  ('room', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80'),
  ('map', 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1400&q=80'),
  ('restaurant', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'),
  ('toiletries', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1400&q=80'),
  ('maintenance', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80'),
  ('headerMaintenance', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80'),
  ('roomServiceIcon', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80'),
  ('housekeeping', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80'),
  ('sauna', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80'),
  ('pool', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=80'),
  ('SPAwellness', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80'),
  ('SPAthai', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1400&q=80'),
  ('wellness', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80'),
  ('gym', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80'),
  ('prague', 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1400&q=80'),
  ('metro', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1400&q=80'),
  ('restaurantFoodMood', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80'),
  ('barLobby', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80'),
  ('welcome', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'),
  ('intouch', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80'),
  ('safe', 'https://images.unsplash.com/photo-1554224311-beee4ece8c1b?auto=format&fit=crop&w=1400&q=80'),
  ('informace', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'),
  ('pokoje', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80'),
  ('homeMap', 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1400&q=80'),
  ('restauraceBar', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1400&q=80'),
  ('doplnky', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1400&q=80'),
  ('headerDoplnky', 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1400&q=80'),
  ('homeHousekeeping', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80'),
  ('hotelProgram', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80'),
  ('breakfast', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1400&q=80'),
  ('lunch', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80'),
  ('dinner', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80'),
  ('snidaneHeader', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1400&q=80'),
  ('obedHeader', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80'),
  ('vecereHeader', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80');

update public.venues t set image_key = u.url from image_key_urls u where t.image_key = u.k;
update public.hotel_room_types t set image_key = u.url from image_key_urls u where t.image_key = u.k;
update public.wellness_facilities t set image_key = u.url from image_key_urls u where t.image_key = u.k;
update public.fitness_facilities t set image_key = u.url from image_key_urls u where t.image_key = u.k;
update public.hotel_info_topics t set list_image_key = u.url from image_key_urls u where t.list_image_key = u.k;
update public.hotel_info_topics t set detail_image_key = u.url from image_key_urls u where t.detail_image_key = u.k;
update public.hotel_parking_topics t set list_image_key = u.url from image_key_urls u where t.list_image_key = u.k;
update public.hotel_parking_topics t set detail_image_key = u.url from image_key_urls u where t.detail_image_key = u.k;
update public.hotel_relax_sport_areas t set home_image_key = u.url from image_key_urls u where t.home_image_key = u.k;
update public.hotel_room_service_menus t set list_image_key = u.url from image_key_urls u where t.list_image_key = u.k;
update public.hotel_room_service_menus t set header_image_key = u.url from image_key_urls u where t.header_image_key = u.k;
update public.hotel_housekeeping t set header_image_key = u.url from image_key_urls u where t.header_image_key = u.k;
update public.hotel_housekeeping_items t set icon_image_key = u.url from image_key_urls u where t.icon_image_key = u.k;
update public.hotel_supplies t set header_image_key = u.url from image_key_urls u where t.header_image_key = u.k;
update public.hotel_maintenance t set header_image_key = u.url from image_key_urls u where t.header_image_key = u.k;
update public.fitness_facility_images t
set image_url = coalesce(nullif(t.image_url, ''), u.url)
from image_key_urls u
where t.image_key = u.k;
update public.fitness_facility_images t set image_key = u.url from image_key_urls u where t.image_key = u.k;
update public.hotel_places t
set image_url = u.url
from image_key_urls u
where u.k = 'prague' and (t.image_url is null or t.image_url not like 'http%');

drop table image_key_urls;
