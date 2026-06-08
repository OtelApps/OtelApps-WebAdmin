-- =============================================================================
-- Concierge Realtime — RLS pro WebAdmin (recepce)
-- Spusť v Supabase SQL Editoru PO hotel_concierge_chat.sql
-- Realtime u tabulek musí být zapnutý v Dashboard → Database → Publications
-- =============================================================================

-- JWT claim hotel_id vydává Laravel (/api/concierge/realtime-config)
-- Pomocná funkce pro RLS
create or replace function public.concierge_jwt_hotel_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(auth.jwt() ->> 'hotel_id', ''),
    ''
  )::uuid;
$$;

-- Recepce: čtení konverzací svého hotelu (Realtime postgres_changes)
drop policy if exists "hcc_staff_select" on public.hotel_concierge_conversations;
create policy "hcc_staff_select" on public.hotel_concierge_conversations
  for select to authenticated
  using (hotel_id = public.concierge_jwt_hotel_id());

-- Recepce: čtení zpráv konverzací svého hotelu
drop policy if exists "hcc_staff_messages_select" on public.hotel_concierge_messages;
create policy "hcc_staff_messages_select" on public.hotel_concierge_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.hotel_concierge_conversations c
      where c.id = conversation_id
        and c.hotel_id = public.concierge_jwt_hotel_id()
    )
  );

comment on policy "hcc_staff_select" on public.hotel_concierge_conversations is
  'WebAdmin Concierge Realtime — SELECT podle hotel_id v JWT (Laravel staff token).';

comment on policy "hcc_staff_messages_select" on public.hotel_concierge_messages is
  'WebAdmin Concierge Realtime — SELECT zpráv hotelu z JWT.';
