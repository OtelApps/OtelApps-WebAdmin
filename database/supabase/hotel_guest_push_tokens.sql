-- =============================================================================
-- OtelApps — push tokeny hostů (mobilní app) + admin preference
-- Spusť v Supabase SQL Editoru.
-- =============================================================================

create table if not exists public.hotel_guest_push_tokens (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  guest_external_id text not null,
  expo_push_token text not null,
  platform text,
  locale text default 'cs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_guest_push_tokens_expo_token_unique unique (expo_push_token)
);

create index if not exists idx_hgpt_hotel_guest
  on public.hotel_guest_push_tokens (hotel_id, guest_external_id);

create index if not exists idx_hgpt_hotel_updated
  on public.hotel_guest_push_tokens (hotel_id, updated_at desc);

-- Upsert push tokenu z mobilní app
create or replace function public.upsert_guest_push_token(
  p_hotel_slug text,
  p_guest_external_id text,
  p_expo_push_token text,
  p_platform text default null,
  p_locale text default 'cs'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hotel_id uuid;
  v_id uuid;
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

  if coalesce(trim(p_expo_push_token), '') = '' then
    raise exception 'expo_push_token je povinný.';
  end if;

  insert into public.hotel_guest_push_tokens (
    hotel_id,
    guest_external_id,
    expo_push_token,
    platform,
    locale,
    updated_at
  )
  values (
    v_hotel_id,
    trim(p_guest_external_id),
    trim(p_expo_push_token),
    nullif(trim(p_platform), ''),
    coalesce(nullif(trim(p_locale), ''), 'cs'),
    now()
  )
  on conflict (expo_push_token) do update set
    hotel_id = excluded.hotel_id,
    guest_external_id = excluded.guest_external_id,
    platform = excluded.platform,
    locale = excluded.locale,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.upsert_guest_push_token(
  text, text, text, text, text
) to anon, authenticated;

-- Odstranění tokenu při odhlášení
create or replace function public.remove_guest_push_token(
  p_expo_push_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_expo_push_token), '') = '' then
    return false;
  end if;

  delete from public.hotel_guest_push_tokens
  where expo_push_token = trim(p_expo_push_token);

  return found;
end;
$$;

grant execute on function public.remove_guest_push_token(text) to anon, authenticated;

-- Rozšíření výchozích admin preferencí o push do mobilní app
update public.hotel_admin_notification_settings
set preferences = preferences || '{
  "guest_push_enabled": true,
  "guest_push_on_status_change": true
}'::jsonb
where not (preferences ? 'guest_push_enabled');

notify pgrst, 'reload schema';
