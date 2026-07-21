-- Aktualizace guest_locale při znovuotevření existující konverzace
-- (spusť v Supabase SQL Editor)

create or replace function public.ensure_guest_concierge_conversation(
  p_hotel_slug text,
  p_guest_external_id text,
  p_guest_display_name text,
  p_room_number text,
  p_guest_locale text,
  p_conversation_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_conversation_id uuid;
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    raise exception 'Chybí guest_external_id.';
  end if;

  select h.id into v_hotel_id
  from public.hotels h
  where h.slug = p_hotel_slug;

  if v_hotel_id is null then
    raise exception 'Hotel "%" nenalezen.', p_hotel_slug;
  end if;

  if p_conversation_id is not null then
    select c.id into v_conversation_id
    from public.hotel_concierge_conversations c
    where c.id = p_conversation_id
      and c.guest_external_id = p_guest_external_id;

    if v_conversation_id is not null then
      update public.hotel_concierge_conversations
      set guest_locale = coalesce(nullif(trim(p_guest_locale), ''), guest_locale),
          updated_at = now()
      where id = v_conversation_id;
      return v_conversation_id;
    end if;
  end if;

  select c.id into v_conversation_id
  from public.hotel_concierge_conversations c
  where c.hotel_id = v_hotel_id
    and c.guest_external_id = p_guest_external_id
    and c.status = 'open'
  order by coalesce(c.last_message_at, c.created_at) desc
  limit 1;

  if v_conversation_id is not null then
    update public.hotel_concierge_conversations
    set guest_locale = coalesce(nullif(trim(p_guest_locale), ''), guest_locale),
        updated_at = now()
    where id = v_conversation_id;
    return v_conversation_id;
  end if;

  insert into public.hotel_concierge_conversations (
    hotel_id,
    guest_external_id,
    guest_display_name,
    room_number,
    guest_locale,
    metadata
  )
  values (
    v_hotel_id,
    p_guest_external_id,
    coalesce(nullif(trim(p_guest_display_name), ''), 'Host'),
    nullif(trim(p_room_number), ''),
    coalesce(nullif(trim(p_guest_locale), ''), 'cs'),
    jsonb_build_object('mode', 'bot')
  )
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;
