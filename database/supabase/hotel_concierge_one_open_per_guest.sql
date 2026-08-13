-- =============================================================================
-- Fix: jedna AKTIVNÍ (open) konverzace na hosta — historie closed/archived může
-- existovat vedle (nebo po resolveAndDelete zbylý řádek neblokuje nový chat).
-- =============================================================================

drop index if exists public.idx_hcc_one_conversation_per_guest;

create unique index idx_hcc_one_conversation_per_guest
  on public.hotel_concierge_conversations (hotel_id, guest_external_id)
  where guest_external_id is not null
    and status = 'open';
