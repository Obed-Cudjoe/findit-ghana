-- 008_price_alerts.sql — WhatsApp price-drop watchlist.
-- Run in the Supabase SQL Editor after 001_init.sql (and after 002–007 if
-- you've applied them). Safe to run more than once.
--
-- Shoppers subscribe on a product page (target price + WhatsApp number);
-- the daily /api/refresh cron compares today's lowest price against active
-- alerts and flips matching rows to "triggered". The admin dashboard lists
-- triggered alerts with one-tap wa.me links for manual delivery (free path
-- until a WhatsApp Business API account is connected).

create table if not exists public.price_alerts (
  id              uuid primary key default gen_random_uuid(),
  product_slug    text not null,
  product_name    text not null,
  phone           text not null,           -- WhatsApp number (digits only)
  target_price_ghs numeric(10,2) not null check (target_price_ghs > 0),
  status          text not null default 'active'
                  check (status in ('active','triggered','cancelled')),
  created_at      timestamptz not null default now(),
  triggered_at    timestamptz
);

create index if not exists idx_price_alerts_status on public.price_alerts (status);

-- Phone numbers are private: only the service-role path reads this table.
alter table public.price_alerts enable row level security;
create policy "anon insert alerts" on public.price_alerts for insert with check (true);
