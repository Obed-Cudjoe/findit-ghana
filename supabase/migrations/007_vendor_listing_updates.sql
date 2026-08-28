-- 007_vendor_listing_updates.sql — track when a vendor last edited a listing.
-- Run in the Supabase SQL Editor after 006_listing_images.sql.
--
-- Vendors can now edit the price / stock / delivery / description of their
-- own listings from /vendor/listings (PATCH /api/vendor/listings/[id]).
-- updated_at powers the "Prices checked …" freshness on the product page
-- (falls back to created_at for older rows). Approved edits go live
-- immediately — the update sets status-free fields only, so no re-review.
--
-- Existing rows get now() via the default — acceptable: the mapper falls
-- back to created_at until an edit actually happens.
-- Safe to run more than once.

alter table public.vendor_listings
  add column if not exists updated_at timestamptz not null default now();

comment on column public.vendor_listings.updated_at is
  'Last time the vendor edited this listing (price/stock/delivery/description). New rows default to now(); older rows use created_at as their fallback freshness.';
