-- 005_unlimited_plan.sql — adds the top "Unlimited" vendor tier.
-- Run in the Supabase SQL Editor after 001_init.sql, 002_featured_listings.sql,
-- 003_vendor_plans.sql and 004_vendor_passwords.sql.
--
-- New ladder:
--   free      — GH₵0,      1 listing
--   starter   — GH₵50/mo,  10 listings
--   pro       — GH₵150/mo, 25 listings
--   unlimited — GH₵300/mo, unlimited listings + ∞ badge + top of search
--
-- 003 created `plan` / `requested_plan` CHECK constraints that only allow
-- ('free','starter','pro'). Postgres blocks any write of 'unlimited' until
-- those constraints are replaced, so this migration swaps them for versions
-- that include the new tier. Safe to run more than once.

-- ---------- vendor_profiles.plan ----------
do $$
declare
  c record;
begin
  if to_regclass('public.vendor_profiles') is null then
    raise notice '005_unlimited_plan: public.vendor_profiles not found — run 003_vendor_plans.sql first.';
    return;
  end if;

  -- Drop whatever CHECK currently pins the plan column (Postgres names the
  -- one from 003 automatically, so we look it up instead of guessing).
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.vendor_profiles'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%plan%'
  loop
    execute format('alter table public.vendor_profiles drop constraint %I', c.conname);
  end loop;

  alter table public.vendor_profiles
    add constraint vendor_profiles_plan_check
    check (plan in ('free', 'starter', 'pro', 'unlimited'));
end $$;

comment on column public.vendor_profiles.plan is
  'free | starter (GH₵50/mo, 10 listings) | pro (GH₵150/mo, 25 listings) | unlimited (GH₵300/mo, unlimited listings, top of search)';

-- ---------- vendor_listings.requested_plan ----------
do $$
declare
  c record;
begin
  if to_regclass('public.vendor_listings') is null then
    raise notice '005_unlimited_plan: public.vendor_listings not found — run 001_init.sql first.';
    return;
  end if;

  -- 003 added requested_plan; projects still on 001 simply have no column,
  -- in which case there is no constraint to relax.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vendor_listings'
      and column_name = 'requested_plan'
  ) then
    raise notice '005_unlimited_plan: vendor_listings.requested_plan not found — skipping (run 003_vendor_plans.sql to add it).';
    return;
  end if;

  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.vendor_listings'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%plan%'
  loop
    execute format('alter table public.vendor_listings drop constraint %I', c.conname);
  end loop;

  alter table public.vendor_listings
    add constraint vendor_listings_requested_plan_check
    check (requested_plan is null or requested_plan in ('free', 'starter', 'pro', 'unlimited'));
end $$;

-- Admin grants the tier from /admin/vendors → "MoMo → Unlimited 30d", which
-- sets plan='unlimited', payment_status='confirmed' and a 30-day expiry.
-- Shops on it are picked up by planHasUnlimited() in lib/plans.ts.
