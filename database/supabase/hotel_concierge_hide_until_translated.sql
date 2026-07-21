-- Host neuvidí staff/bot zprávu, dokud není body_translated (pro non-CS hosty).
-- Spusť v Supabase SQL Editor.

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
  created_at timestamptz
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
    m.created_at
  from public.hotel_concierge_messages m
  join public.hotel_concierge_conversations c on c.id = m.conversation_id
  where m.conversation_id = p_conversation_id
    and c.guest_external_id = p_guest_external_id
    -- Staff/bot pro cizojazyčného hosta až po překladu (CS host vidí body hned).
    and not (
      m.sender_type in ('staff', 'bot')
      and coalesce(c.guest_locale, 'cs') <> 'cs'
      and (m.body_translated is null or trim(m.body_translated) = '')
    )
    -- Staff-only systémové zprávy host nikdy
    and coalesce(m.staff_display_name, '') <> '__staff_only__'
  order by m.created_at asc;
end;
$$;

grant execute on function public.get_guest_concierge_messages(uuid, text) to anon, authenticated;

-- unread_guest jen když host zprávu opravdu uvidí
create or replace function public.hotel_concierge_on_message_insert()
returns trigger
language plpgsql
as $$
declare
  v_mode text;
  v_locale text;
  v_visible_to_guest boolean;
begin
  select
    coalesce(c.metadata->>'mode', 'bot'),
    coalesce(c.guest_locale, 'cs')
  into v_mode, v_locale
  from public.hotel_concierge_conversations c
  where c.id = new.conversation_id;

  v_visible_to_guest := case
    when new.sender_type = 'guest' then false
    when coalesce(new.staff_display_name, '') = '__staff_only__' then false
    when new.sender_type in ('staff', 'bot')
      and v_locale <> 'cs'
      and (new.body_translated is null or trim(new.body_translated) = '')
      then false
    when new.sender_type in ('staff', 'bot', 'system') then true
    else false
  end;

  update public.hotel_concierge_conversations c
  set
    last_message_preview = left(
      case
        when new.sender_type in ('staff', 'bot', 'system') then coalesce(new.body_translated, new.body)
        else new.body
      end,
      200
    ),
    last_message_at = new.created_at,
    updated_at = now(),
    unread_staff_count = case
      when new.sender_type = 'guest' and v_mode in ('staff', 'waiting')
        then c.unread_staff_count + 1
      else c.unread_staff_count
    end,
    unread_guest_count = case
      when v_visible_to_guest then c.unread_guest_count + 1
      else c.unread_guest_count
    end
  where c.id = new.conversation_id;

  return new;
end;
$$;

-- Když doběhne překlad staff/bot → bump unread_guest (host zprávu teprve teď uvidí)
create or replace function public.hotel_concierge_on_message_translated()
returns trigger
language plpgsql
as $$
declare
  v_locale text;
begin
  if new.sender_type not in ('staff', 'bot') then
    return new;
  end if;

  -- překlad se právě doplnil
  if (old.body_translated is null or trim(old.body_translated) = '')
     and new.body_translated is not null
     and trim(new.body_translated) <> '' then

    select coalesce(c.guest_locale, 'cs') into v_locale
    from public.hotel_concierge_conversations c
    where c.id = new.conversation_id;

    if v_locale <> 'cs' then
      update public.hotel_concierge_conversations c
      set
        unread_guest_count = c.unread_guest_count + 1,
        last_message_preview = left(coalesce(new.body_translated, new.body), 200),
        last_message_at = greatest(c.last_message_at, new.created_at),
        updated_at = now()
      where c.id = new.conversation_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hcc_message_translated on public.hotel_concierge_messages;
create trigger trg_hcc_message_translated
  after update of body_translated on public.hotel_concierge_messages
  for each row execute function public.hotel_concierge_on_message_translated();
