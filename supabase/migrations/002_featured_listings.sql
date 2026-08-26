-- 002_featured_listings.sql — paid featured vendor placements.
-- Run in the Supabase SQL Editor if your project was initialised with
-- 001_init.sql already (fresh projects: just run 001 then 002 in order).
--
-- A listing is "featured" while featured_until is in the future: it is pinned
-- to the top of its category and badged with ★ across the site. The admin
-- sets it from /admin/listings → "★ Feature 30d" after the vendor's MoMo
-- payment clears (GH₵150/month — see the "Get featured" section on /for-vendors).

ALTER TABLE vendor_listings
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_vendor_listings_featured
  ON vendor_listings (featured_until)
  WHERE status = 'approved';
