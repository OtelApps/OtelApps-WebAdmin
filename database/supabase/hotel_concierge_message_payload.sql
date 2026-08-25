-- Interactive bot reply cards: payload jsonb on messages + expose via guest RPC.
-- Mirror of OtelApps/supabase/migrations/20250807120000_hotel_concierge_message_payload.sql
alter table public.hotel_concierge_messages
  add column if not exists payload jsonb not null default '{}'::jsonb;

comment on column public.hotel_concierge_messages.payload is
  'Optional rich content for bot/system messages (card title/subtitle + action buttons).';

drop function if exists public.get_guest_concierge_messages(uuid, text);

create or replace function public.get_guest_concierge_messages(
  p_conversation_id uuid,
  p_guest_external_id text
)
returns table (
  id uuid,
  sender_type text,
  body text,
  body_translated text,
  locale text,
  staff_display_name text,
  created_at timestamptz,
  payload jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_guest_external_id is null or trim(p_guest_external_id) = '' then
    return;
  end if;

  return query
  select
    m.id,
    m.sender_type,
    m.body,
    m.body_translated,
    m.locale,
    m.staff_display_name,
    m.created_at,
    coalesce(m.payload, '{}'::jsonb) as payload
  from public.hotel_concierge_messages m
  join public.hotel_concierge_conversations c on c.id = m.conversation_id
  where m.conversation_id = p_conversation_id
    and c.guest_external_id = p_guest_external_id
    and not (
      m.sender_type in ('staff', 'bot')
      and coalesce(c.guest_locale, 'cs') <> 'cs'
      and (m.body_translated is null or trim(m.body_translated) = '')
    )
    and coalesce(m.staff_display_name, '') <> '__staff_only__'
  order by m.created_at asc;
end;
$$;

grant execute on function public.get_guest_concierge_messages(uuid, text) to anon, authenticated;
