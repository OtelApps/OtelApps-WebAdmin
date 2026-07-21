-- =============================================================================
-- Concierge — heslovitá historie vyřešených chatů (po „Ano, vyřešeno“)
-- Spusť v Supabase SQL Editor.
-- =============================================================================

create table if not exists public.hotel_concierge_case_summaries (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_external_id text not null,
  guest_locale text not null default 'cs' check (
    guest_locale in ('cs', 'en', 'de', 'fr', 'pl')
  ),
  summary text not null,
  summary_cs text,
  room_number text,
  resolved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.hotel_concierge_case_summaries is
  'Heslovité shrnutí vyřešeného chatu — plný thread se maže, v appce zůstane kartička.';

create index if not exists idx_hccs_guest_resolved
  on public.hotel_concierge_case_summaries (guest_external_id, resolved_at desc);

create index if not exists idx_hccs_hotel_resolved
  on public.hotel_concierge_case_summaries (hotel_id, resolved_at desc);

alter table public.hotel_concierge_case_summaries enable row level security;

drop policy if exists "hccs_guest_read_own" on public.hotel_concierge_case_summaries;
create policy "hccs_guest_read_own" on public.hotel_concierge_case_summaries
  for select to anon, authenticated
  using (
    guest_external_id = coalesce(current_setting('request.jwt.claim.sub', true), '')
  );

create or replace function public.get_guest_concierge_case_summaries(
  p_guest_external_id text
)
returns table (
  id uuid,
  summary text,
  summary_cs text,
  guest_locale text,
  room_number text,
  resolved_at timestamptz
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
    s.id,
    s.summary,
    s.summary_cs,
    s.guest_locale,
    s.room_number,
    s.resolved_at
  from public.hotel_concierge_case_summaries s
  where s.guest_external_id = p_guest_external_id
  order by s.resolved_at desc
  limit 50;
end;
$$;

grant execute on function public.get_guest_concierge_case_summaries(text) to anon, authenticated;
