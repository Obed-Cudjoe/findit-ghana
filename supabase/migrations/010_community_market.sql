-- Community classifieds for the WhatsApp group. These remain separate from
-- FindIt's curated price-comparison catalogue and vendor marketplace.
-- Run after 009_actual_prices.sql.

create table if not exists public.community_market_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null check (category in ('electronics','clothing','books-study','home','food-services','other')),
  description text not null default '',
  price_ghs numeric(12,2) not null check (price_ghs >= 0),
  condition text not null default 'unspecified' check (condition in ('new','used','refurbished','unspecified')),
  location text not null default '',
  seller_name text not null,
  seller_whatsapp text not null,
  image_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected','sold')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists community_market_status_expiry_idx
  on public.community_market_listings (status, expires_at desc);
create index if not exists community_market_category_idx
  on public.community_market_listings (category, status);

alter table public.community_market_listings enable row level security;
-- No anon/authenticated policies. Public pages and form writes use the server
-- with SUPABASE_SERVICE_ROLE_KEY; seller contact details are never exposed for
-- pending, rejected, sold, or expired listings.
