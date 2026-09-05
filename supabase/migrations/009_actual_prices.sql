-- COMP-19: crowd-sourced actual prices paid by shoppers.
-- Submissions are 'new' until an admin approves them; only 'approved' rows
-- are ever shown on public pages (aggregated, never individually).
create table if not exists public.actual_prices (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  price_paid_ghs numeric not null,
  shop_name text,
  paid_at timestamptz default now(),
  status text not null default 'new',
  created_at timestamptz default now()
);

alter table public.actual_prices enable row level security;

create index if not exists actual_prices_slug_idx
  on public.actual_prices (product_slug);
