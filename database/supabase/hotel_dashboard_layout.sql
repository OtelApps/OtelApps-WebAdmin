-- =============================================================================
-- OtelApps — layout dashboard widgetů (pořadí + viditelnost)
-- Spusť v Supabase SQL Editoru
-- =============================================================================

create table if not exists public.hotel_dashboard_layout (
  hotel_id uuid primary key references public.hotels (id) on delete cascade,
  widgets jsonb not null default '[
    "hotel_overview",
    "guest_requests",
    "revenue_upsell",
    "add_content",
    "manage_requests"
  ]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint hotel_dashboard_layout_widgets_is_array check (jsonb_typeof(widgets) = 'array')
);

insert into public.hotel_dashboard_layout (hotel_id)
select id from public.hotels where slug = 'default'
on conflict (hotel_id) do nothing;
