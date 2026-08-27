-- 003_vendor_plans.sql — multi-vendor listing plans + vendor profiles.
-- Run in the Supabase SQL Editor after 001_init.sql and 002_featured_listings.sql.
--
-- Plans:
--   free    — 1 listing
--   starter — GH₵50/month, up to 3 listings, ★ featured rotation in category
--   pro     — GH₵150/month, up to 10 listings, homepage featured shop, per-vendor stats
--
-- Paid plans stay live while payment_status = 'confirmed' AND plan_expires_at
-- is in the future. The admin sets both from /admin/vendors after MoMo clears.

-- ---------- vendor profiles (one shop per WhatsApp / business) ----------
create table if not exists public.vendor_profiles (
  id               uuid primary key default gen_random_uuid(),
  business_name    text not null,
  slug             text not null unique,
  contact_name     text,
  phone            text not null,
  email            text,
  website_url      text,
  plan             text not null default 'free' check (plan in ('free','starter','pro')),
  plan_expires_at  timestamptz,
  payment_status   text not null default 'none' check (payment_status in ('none','pending','confirmed')),
  momo_reference   text,
  verified         boolean not null default false,
  logo_hue         int not null default 210,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_vendor_profiles_phone on public.vendor_profiles (phone);
create index if not exists idx_vendor_profiles_plan on public.vendor_profiles (plan, plan_expires_at)
  where status = 'approved';

alter table public.vendor_profiles enable row level security;
-- No public SELECT — profiles contain phone numbers. Pages read via service role.

-- Link listings to a shop + remember the plan they asked for at submit time.
ALTER TABLE public.vendor_listings
  ADD COLUMN IF NOT EXISTS vendor_id uuid references public.vendor_profiles(id) on delete set null;

ALTER TABLE public.vendor_listings
  ADD COLUMN IF NOT EXISTS requested_plan text default 'free'
    check (requested_plan is null or requested_plan in ('free','starter','pro'));

CREATE INDEX IF NOT EXISTS idx_vendor_listings_vendor
  ON public.vendor_listings (vendor_id);
