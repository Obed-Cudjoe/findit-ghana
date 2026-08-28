-- 006_listing_images.sql — vendor product photos (3–6 per listing).
-- Run in the Supabase SQL Editor after 001_init.sql, 002_featured_listings.sql,
-- 003_vendor_plans.sql, 004_vendor_passwords.sql and 005_unlimited_plan.sql.
--
-- Vendors upload at least 3 photos of the product so buyers can see it
-- before contacting the shop. Photos live in the public `vendor-images`
-- storage bucket; the listing row keeps the public URLs in image_urls.
-- Safe to run more than once.

-- ---------- vendor_listings.image_urls ----------
alter table public.vendor_listings
  add column if not exists image_urls jsonb not null default '[]';

comment on column public.vendor_listings.image_urls is
  'Public URLs of the product photos (3–6) uploaded by the vendor, e.g. Supabase Storage URLs or /uploads/... paths in dev.';

-- ---------- storage bucket ----------
insert into storage.buckets (id, name, public)
values ('vendor-images', 'vendor-images', true)
on conflict (id) do update set public = true;

-- Anonymous reads work because the bucket is public; writes go through the
-- service role from the Next.js API route, which bypasses storage RLS.
