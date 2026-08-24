-- ============================================================
-- FindIt Ghana · 001_init.sql
-- Run in Supabase → SQL Editor (or `supabase db push`)
-- Postgres 15+ on Supabase free tier (500 MB)
-- ============================================================

-- ---------- TABLES ----------

-- vendors: named sellers — the trust layer (PP01-PP08)
create table if not exists public.vendors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  verified    boolean not null default false,
  source      text not null default 'direct',      -- 'jumia' | 'jiji' | 'direct' | 'import'
  external_id text,                                 -- vendor id on the source platform
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- products: one row per product; pages are programmatic (P03)
create table if not exists public.products (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  slug                    text not null unique,
  category                text not null,           -- top-level: 'Phones', 'Laptops', ...
  brand                   text,
  image_url               text,
  specs                   jsonb not null default '{}'::jsonb,
  canonical_affiliate_url text,                    -- fallback outbound link
  source                  text not null default 'seed',  -- 'seed' | 'jumia' | 'manual'
  source_id               text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_name on public.products using gin (to_tsvector('simple', name));

-- price_offers: the vendor comparison rows on P03 (COMP-08)
create table if not exists public.price_offers (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  vendor_id         uuid not null references public.vendors (id) on delete cascade,
  price_ghs         numeric(10,2) not null check (price_ghs > 0),
  stock_count       int,
  delivery_zone     text not null default 'Ghana-wide',
  delivery_days_min int,
  delivery_days_max int,
  delivery_fee_ghs  numeric(10,2) not null default 0,
  affiliate_url     text not null,
  last_checked_at   timestamptz not null default now(),
  is_active         boolean not null default true
);
create index if not exists idx_offers_product on public.price_offers (product_id) where is_active;
create index if not exists idx_offers_vendor  on public.price_offers (vendor_id);

-- price_snapshots: price history chart (F11)
create table if not exists public.price_snapshots (
  id          bigint generated always as identity primary key,
  offer_id    uuid not null references public.price_offers (id) on delete cascade,
  price_ghs   numeric(10,2) not null,
  captured_at timestamptz not null default now()
);
create index if not exists idx_snapshots_offer on public.price_snapshots (offer_id, captured_at desc);

-- reports: corrections + suspicious reports → admin queue (P22, SLA = 1 business day)
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('price_error','stock_error','delivery_error','other','suspicious')),
  ref_code      text not null unique,              -- 'GH-48213' shown to the reporter (COMP-14)
  listing_url   text,
  vendor_name   text,
  detail        text not null,
  evidence_url  text,                              -- Supabase Storage object URL
  reporter_email text,
  status        text not null default 'new' check (status in ('new','checking','fixed','dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

-- contact_messages: P12 form submissions
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null default 'general',
  message    text not null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- guides: blog / price guides (P17/P18), edited via admin P24
create table if not exists public.guides (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  body_md          text not null,
  seo_title        text,
  meta_description text,
  published        boolean not null default false,
  updated_at       timestamptz not null default now()
);

-- click_events: affiliate outbound click tracking (F33, COMP-17)
create table if not exists public.click_events (
  id              bigint generated always as identity primary key,
  offer_id        uuid references public.price_offers (id) on delete set null,
  product_slug    text,
  vendor_name     text,
  destination_url text not null,
  created_at      timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
-- Public (anon key): read published data, insert form submissions.
-- Everything else: serverless functions use the SERVICE ROLE key (bypasses RLS).
-- No admin policies are needed: admin actions go through service-role route handlers.

alter table public.vendors          enable row level security;
alter table public.products         enable row level security;
alter table public.price_offers     enable row level security;
alter table public.price_snapshots  enable row level security;
alter table public.reports          enable row level security;
alter table public.contact_messages enable row level security;
alter table public.guides           enable row level security;
alter table public.click_events     enable row level security;

create policy "public read vendors"    on public.vendors   for select using (true);
create policy "public read products"   on public.products  for select using (true);
create policy "public read offers"     on public.price_offers for select using (is_active);
create policy "public read snapshots"  on public.price_snapshots for select using (true);
create policy "public read guides"     on public.guides     for select using (published);

create policy "anon insert reports"    on public.reports          for insert with check (true);
create policy "anon insert contact"    on public.contact_messages for insert with check (true);
create policy "anon insert clicks"     on public.click_events     for insert with check (true);

-- ---------- ADMIN AUTH (P21/P22/P24) ----------
-- One admin account, created manually in Supabase → Authentication → Users.
-- Sign-up endpoint stays disabled. `admin` role is checked in app middleware via the user's
-- app_metadata; run this after creating the user:
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"admin": true}'::jsonb
-- where email = 'you@example.com';

-- ---------- vendor self-listing (For Vendors page) ----------
-- Vendors submit products; admin approves before they appear publicly.
-- NOTE: no public SELECT policy — listings contain phone numbers, so they
-- are read server-side via the service-role key only.
create table if not exists public.vendor_listings (
  id               uuid primary key default gen_random_uuid(),
  business_name    text not null,
  contact_name     text,
  phone            text not null,
  email            text,
  product_name     text not null,
  slug             text unique,
  category         text not null,
  price_ghs        numeric(10,2) not null check (price_ghs > 0),
  stock_count      int,
  delivery_zone    text,
  delivery_days_min int default 1,
  delivery_days_max int default 3,
  delivery_fee_ghs numeric(10,2) not null default 0,
  description      text not null,
  website_url      text,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now()
);
alter table public.vendor_listings enable row level security;
create policy "anon insert listings" on public.vendor_listings for insert with check (true);
