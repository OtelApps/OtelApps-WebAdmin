-- =============================================================================
-- OtelApps — čtení požadavků hosta (SECURITY DEFINER RPC)
--
-- RLS hsr_guest_read_own vyžaduje JWT sub = guest_external_id. Web i mobil
-- volají Supabase s anon klíčem, takže přímý SELECT nic nevrátí.
-- Bez této funkce host vidí jen optimistic snapshot se statusem 'new'.
-- =============================================================================

create or replace function public.get_guest_service_requests(p_guest_external_id text)
returns table (
  id uuid,
  request_number text,
  service_module text,
  service_label text,
  service_icon text,
  request_text text,
  status text,
  status_guest_note text,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
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
    r.id,
    r.request_number,
    r.service_module,
    r.service_label,
    r.service_icon,
    r.request_text,
    r.status,
    r.status_guest_note,
    r.metadata,
    r.created_at,
    r.updated_at
  from public.hotel_service_requests r
  where r.guest_external_id = p_guest_external_id
    and r.status not in ('archived')
  order by r.created_at desc
  limit 20;
end;
$$;

grant execute on function public.get_guest_service_requests(text) to anon, authenticated;

notify pgrst, 'reload schema';
