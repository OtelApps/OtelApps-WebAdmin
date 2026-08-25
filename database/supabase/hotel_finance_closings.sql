-- =============================================================================
-- OtelApps — Finance: platební ledger + noční finanční uzávěrka
-- Spusť v Supabase: SQL Editor → New query → vlož celý soubor → Run
-- Předpoklad: public.hotels existuje (slug 'default').
-- =============================================================================

insert into public.hotels (slug, name)
values ('default', 'Grand Hotel Prague')
on conflict (slug) do update set name = excluded.name;

-- ---------------------------------------------------------------------------
-- Nastavení finance per hotel
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_finance_settings (
  hotel_id uuid primary key references public.hotels (id) on delete cascade,
  financial_day_start_time text not null default '06:00',
  default_cash_float numeric(12, 2) not null default 5000,
  closing_variance_warning numeric(12, 2) not null default 10,
  closing_variance_blocking numeric(12, 2) not null default 100,
  primary_currency text not null default 'CZK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Platební metody (dynamické per hotel)
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_payment_methods (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  code text not null,
  label text not null,
  currency text,
  is_cash boolean not null default false,
  requires_manual_count boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, code)
);

create index if not exists idx_hotel_payment_methods_hotel
  on public.hotel_payment_methods (hotel_id, sort_order);

-- ---------------------------------------------------------------------------
-- Terminály (minimální entita)
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_payment_terminals (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, code)
);

create index if not exists idx_hotel_payment_terminals_hotel
  on public.hotel_payment_terminals (hotel_id);

-- ---------------------------------------------------------------------------
-- Platební ledger
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_payments (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  payment_method_id uuid not null references public.hotel_payment_methods (id) on delete restrict,
  terminal_id uuid references public.hotel_payment_terminals (id) on delete set null,
  amount numeric(12, 2) not null,
  currency text not null default 'CZK',
  status text not null default 'completed' check (
    status in ('completed', 'pending', 'refunded', 'cancelled', 'unknown')
  ),
  paid_at timestamptz not null default now(),
  created_by text,
  source text not null default 'manual',
  reference_type text,
  reference_id text,
  guest_name text,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_payments_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hotel_payments_hotel_paid
  on public.hotel_payments (hotel_id, paid_at);
create index if not exists idx_hotel_payments_hotel_status_paid
  on public.hotel_payments (hotel_id, status, paid_at);
create index if not exists idx_hotel_payments_method_paid
  on public.hotel_payments (payment_method_id, paid_at);

-- ---------------------------------------------------------------------------
-- Finanční uzávěrky
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_financial_closings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  business_date date not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'in_progress' check (
    status in ('draft', 'in_progress', 'waiting_for_resolution', 'completed', 'reopened')
  ),
  primary_currency text not null default 'CZK',
  expected_total numeric(12, 2) not null default 0,
  actual_total numeric(12, 2) not null default 0,
  variance_total numeric(12, 2) not null default 0,
  totals_by_currency jsonb not null default '{}'::jsonb,
  cash_float numeric(12, 2) not null default 0,
  deposit_expected numeric(12, 2),
  deposit_actual numeric(12, 2),
  started_by bigint,
  started_by_name text,
  started_at timestamptz not null default now(),
  completed_by bigint,
  completed_by_name text,
  completed_at timestamptz,
  reopened_by bigint,
  reopened_by_name text,
  reopened_at timestamptz,
  reopen_reason text,
  current_step int not null default 1 check (current_step between 1 and 4),
  preflight_ack_at timestamptz,
  preflight_result jsonb not null default '{}'::jsonb,
  payment_ids jsonb not null default '[]'::jsonb,
  snapshot jsonb,
  handover_summary text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_financial_closings_totals_by_currency_is_object
    check (jsonb_typeof(totals_by_currency) = 'object'),
  constraint hotel_financial_closings_preflight_is_object
    check (jsonb_typeof(preflight_result) = 'object'),
  constraint hotel_financial_closings_payment_ids_is_array
    check (jsonb_typeof(payment_ids) = 'array')
);

create index if not exists idx_hotel_financial_closings_hotel_date
  on public.hotel_financial_closings (hotel_id, business_date desc);
create index if not exists idx_hotel_financial_closings_hotel_status
  on public.hotel_financial_closings (hotel_id, status);

-- Max 1 otevřená (ne-completed) uzávěrka na hotel
create unique index if not exists uq_hotel_financial_closings_open
  on public.hotel_financial_closings (hotel_id)
  where status in ('draft', 'in_progress', 'waiting_for_resolution', 'reopened');

-- ---------------------------------------------------------------------------
-- Řádky platebních metod v uzávěrce
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_financial_closing_payment_lines (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.hotel_financial_closings (id) on delete cascade,
  payment_method_id uuid not null references public.hotel_payment_methods (id) on delete restrict,
  payment_method_code text not null,
  payment_method_label text not null,
  currency text not null default 'CZK',
  is_cash boolean not null default false,
  requires_manual_count boolean not null default false,
  expected_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2),
  variance numeric(12, 2) not null default 0,
  variance_reason text,
  variance_note text,
  transaction_count int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (closing_id, payment_method_id, currency)
);

create index if not exists idx_hotel_financial_closing_payment_lines_closing
  on public.hotel_financial_closing_payment_lines (closing_id, sort_order);

-- ---------------------------------------------------------------------------
-- Počet hotovosti (denominace)
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_financial_closing_cash_counts (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.hotel_financial_closings (id) on delete cascade,
  currency text not null default 'CZK',
  denomination numeric(12, 2) not null,
  quantity int not null default 0 check (quantity >= 0),
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (closing_id, currency, denomination)
);

create index if not exists idx_hotel_financial_closing_cash_counts_closing
  on public.hotel_financial_closing_cash_counts (closing_id);

-- ---------------------------------------------------------------------------
-- Odvody
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_financial_closing_deposits (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.hotel_financial_closings (id) on delete cascade,
  currency text not null default 'CZK',
  expected_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  destination text not null default 'safe' check (
    destination in ('safe', 'bank_deposit', 'manager', 'other_till', 'other')
  ),
  reference text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hotel_financial_closing_deposits_closing
  on public.hotel_financial_closing_deposits (closing_id);

-- ---------------------------------------------------------------------------
-- Audit events
-- ---------------------------------------------------------------------------
create table if not exists public.hotel_financial_closing_events (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.hotel_financial_closings (id) on delete cascade,
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  user_id bigint,
  user_name text,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint hotel_financial_closing_events_metadata_is_object
    check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_hotel_financial_closing_events_closing
  on public.hotel_financial_closing_events (closing_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS (service role / app connection; policies permissive for authenticated role)
-- ---------------------------------------------------------------------------
alter table public.hotel_finance_settings enable row level security;
alter table public.hotel_payment_methods enable row level security;
alter table public.hotel_payment_terminals enable row level security;
alter table public.hotel_payments enable row level security;
alter table public.hotel_financial_closings enable row level security;
alter table public.hotel_financial_closing_payment_lines enable row level security;
alter table public.hotel_financial_closing_cash_counts enable row level security;
alter table public.hotel_financial_closing_deposits enable row level security;
alter table public.hotel_financial_closing_events enable row level security;

-- ---------------------------------------------------------------------------
-- Seed: settings, methods, terminals, sample payments
-- ---------------------------------------------------------------------------
do $$
declare
  v_hotel_id uuid;
  v_cash uuid;
  v_card uuid;
  v_transfer uuid;
  v_voucher uuid;
  v_other uuid;
  v_term_rec uuid;
  v_term_rest uuid;
begin
  select id into v_hotel_id from public.hotels where slug = 'default' limit 1;
  if v_hotel_id is null then
    raise exception 'Hotel default not found';
  end if;

  insert into public.hotel_finance_settings (
    hotel_id, financial_day_start_time, default_cash_float,
    closing_variance_warning, closing_variance_blocking, primary_currency
  ) values (
    v_hotel_id, '06:00', 5000, 10, 100, 'CZK'
  )
  on conflict (hotel_id) do update set
    financial_day_start_time = excluded.financial_day_start_time,
    default_cash_float = excluded.default_cash_float,
    closing_variance_warning = excluded.closing_variance_warning,
    closing_variance_blocking = excluded.closing_variance_blocking,
    primary_currency = excluded.primary_currency,
    updated_at = now();

  insert into public.hotel_payment_methods (hotel_id, code, label, is_cash, requires_manual_count, sort_order)
  values
    (v_hotel_id, 'card', 'Platební karty', false, false, 10),
    (v_hotel_id, 'cash', 'Hotovost (CZK)', true, true, 20),
    (v_hotel_id, 'bank_transfer', 'Bankovní převody', false, false, 30),
    (v_hotel_id, 'voucher', 'Vouchery', false, false, 40),
    (v_hotel_id, 'other', 'Ostatní', false, false, 50)
  on conflict (hotel_id, code) do update set
    label = excluded.label,
    is_cash = excluded.is_cash,
    requires_manual_count = excluded.requires_manual_count,
    sort_order = excluded.sort_order,
    is_active = true;

  select id into v_cash from public.hotel_payment_methods where hotel_id = v_hotel_id and code = 'cash';
  select id into v_card from public.hotel_payment_methods where hotel_id = v_hotel_id and code = 'card';
  select id into v_transfer from public.hotel_payment_methods where hotel_id = v_hotel_id and code = 'bank_transfer';
  select id into v_voucher from public.hotel_payment_methods where hotel_id = v_hotel_id and code = 'voucher';
  select id into v_other from public.hotel_payment_methods where hotel_id = v_hotel_id and code = 'other';

  insert into public.hotel_payment_terminals (hotel_id, name, code)
  values
    (v_hotel_id, 'Terminál Recepce', 'reception'),
    (v_hotel_id, 'Terminál Restaurace', 'restaurant')
  on conflict (hotel_id, code) do update set name = excluded.name, is_active = true;

  select id into v_term_rec from public.hotel_payment_terminals where hotel_id = v_hotel_id and code = 'reception';
  select id into v_term_rest from public.hotel_payment_terminals where hotel_id = v_hotel_id and code = 'restaurant';

  -- Idempotentní seed: smaž staré seed platby a vlož čerstvé za posledních ~18 h
  delete from public.hotel_payments
  where hotel_id = v_hotel_id
    and coalesce(metadata->>'seed', 'false') = 'true';

  insert into public.hotel_payments (
    hotel_id, payment_method_id, terminal_id, amount, currency, status, paid_at,
    source, guest_name, note, metadata
  ) values
    -- Karty (recepce)
    (v_hotel_id, v_card, v_term_rec, 12500.00, 'CZK', 'completed', now() - interval '14 hours', 'reception', 'Novák', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 8900.00, 'CZK', 'completed', now() - interval '12 hours', 'reception', 'Svobodová', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 15600.00, 'CZK', 'completed', now() - interval '10 hours', 'reception', 'Dvořák', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 7200.00, 'CZK', 'completed', now() - interval '8 hours', 'reception', 'Černý', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 21400.00, 'CZK', 'completed', now() - interval '6 hours', 'reception', 'Procházka', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 9800.00, 'CZK', 'completed', now() - interval '4 hours', 'reception', 'Kučerová', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rec, 7500.00, 'CZK', 'completed', now() - interval '3 hours', 'reception', 'Horák', null, '{"seed":"true"}'::jsonb),
    -- Karty (restaurace)
    (v_hotel_id, v_card, v_term_rest, 3200.00, 'CZK', 'completed', now() - interval '11 hours', 'pos', 'Stůl 4', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rest, 4850.00, 'CZK', 'completed', now() - interval '9 hours', 'pos', 'Stůl 12', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rest, 2100.00, 'CZK', 'completed', now() - interval '5 hours', 'pos', 'Stůl 7', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rest, 15400.00, 'CZK', 'completed', now() - interval '2 hours', 'pos', 'Stůl 2', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_card, v_term_rest, 20000.00, 'CZK', 'completed', now() - interval '1 hour', 'pos', 'Firemní večeře', null, '{"seed":"true"}'::jsonb),
    -- Hotovost
    (v_hotel_id, v_cash, null, 3500.00, 'CZK', 'completed', now() - interval '13 hours', 'reception', 'Malý', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 1200.00, 'CZK', 'completed', now() - interval '11 hours', 'reception', 'Veselá', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 8500.00, 'CZK', 'completed', now() - interval '9 hours', 'reception', 'Král', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 4200.00, 'CZK', 'completed', now() - interval '7 hours', 'reception', 'Pokorný', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 6800.00, 'CZK', 'completed', now() - interval '5 hours', 'reception', 'Beneš', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 9800.00, 'CZK', 'completed', now() - interval '3 hours', 'reception', 'Fiala', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 5980.00, 'CZK', 'completed', now() - interval '2 hours', 'reception', 'Urban', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_cash, null, 5000.00, 'CZK', 'completed', now() - interval '90 minutes', 'reception', 'Němec', null, '{"seed":"true"}'::jsonb),
    -- Převody
    (v_hotel_id, v_transfer, null, 6500.00, 'CZK', 'completed', now() - interval '10 hours', 'import', 'Firma ABC', 'Záloha', '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_transfer, null, 5800.00, 'CZK', 'completed', now() - interval '4 hours', 'import', 'Travel s.r.o.', null, '{"seed":"true"}'::jsonb),
    -- Vouchery
    (v_hotel_id, v_voucher, null, 1500.00, 'CZK', 'completed', now() - interval '8 hours', 'reception', 'Dárkový poukaz', null, '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_voucher, null, 1750.00, 'CZK', 'completed', now() - interval '3 hours', 'reception', 'Partner voucher', null, '{"seed":"true"}'::jsonb),
    -- Ostatní
    (v_hotel_id, v_other, null, 520.00, 'CZK', 'completed', now() - interval '6 hours', 'manual', null, 'Doplatek', '{"seed":"true"}'::jsonb),
    (v_hotel_id, v_other, null, 500.00, 'CZK', 'completed', now() - interval '2 hours', 'manual', null, null, '{"seed":"true"}'::jsonb),
    -- Refund (záporná completed)
    (v_hotel_id, v_card, v_term_rec, -500.00, 'CZK', 'completed', now() - interval '90 minutes', 'reception', 'Novák', 'Refund minibar', '{"seed":"true","is_refund":true}'::jsonb),
    -- Pending (preflight warning)
    (v_hotel_id, v_card, v_term_rec, 1200.00, 'CZK', 'pending', now() - interval '30 minutes', 'reception', 'Čekající', 'Neuzavřená session', '{"seed":"true"}'::jsonb);

end $$;
