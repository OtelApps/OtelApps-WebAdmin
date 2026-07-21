-- Spusť v Supabase SQL Editor.
-- unread_staff_count jen pro mode staff|waiting (ne AI bot).

create or replace function public.hotel_concierge_on_message_insert()
returns trigger
language plpgsql
as $$
declare
  v_mode text;
begin
  select coalesce(c.metadata->>'mode', 'bot')
    into v_mode
  from public.hotel_concierge_conversations c
  where c.id = new.conversation_id;

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
      when new.sender_type in ('staff', 'bot', 'system') then c.unread_guest_count + 1
      else c.unread_guest_count
    end
  where c.id = new.conversation_id;

  return new;
end;
$$;

update public.hotel_concierge_conversations
set unread_staff_count = 0
where coalesce(metadata->>'mode', 'bot') = 'bot'
  and unread_staff_count > 0;
