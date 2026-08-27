-- 004_vendor_passwords.sql — shop login for /vendor dashboard.
-- Run after 003_vendor_plans.sql.
-- password_hash is scrypt (salt:key hex). Never exposed to the public API.

ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS password_hash text;
