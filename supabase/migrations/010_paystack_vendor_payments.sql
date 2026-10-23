-- Paystack one-time payments for 30-day vendor plans.
-- Apply in Supabase SQL Editor after the existing vendor plan migrations.
-- The legacy plan key "unlimited" represents the capped Growth plan in the UI.

create table if not exists public.paystack_vendor_payments (
  reference text primary key,
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  plan_id text not null check (plan_id in ('starter', 'pro', 'unlimited')),
  amount_pesewas integer not null check (amount_pesewas > 0),
  currency text not null default 'GHS' check (currency = 'GHS'),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists paystack_vendor_payments_vendor_idx
  on public.paystack_vendor_payments (vendor_id, created_at desc);

alter table public.paystack_vendor_payments enable row level security;
-- No client policies: payment records are accessed only by the server service role.

create or replace function public.confirm_paystack_vendor_payment(
  p_reference text,
  p_vendor_id uuid,
  p_plan_id text,
  p_amount_pesewas integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_row public.paystack_vendor_payments%rowtype;
  updated_rows integer;
begin
  select * into payment_row
  from public.paystack_vendor_payments
  where reference = p_reference
  for update;

  if not found then
    return false;
  end if;

  if payment_row.vendor_id <> p_vendor_id
     or payment_row.plan_id <> p_plan_id
     or payment_row.amount_pesewas <> p_amount_pesewas
     or payment_row.currency <> 'GHS' then
    return false;
  end if;

  -- Webhook and browser callback can arrive more than once; grant access once only.
  if payment_row.status = 'success' then
    return true;
  end if;
  if payment_row.status <> 'pending' then
    return false;
  end if;

  update public.vendor_profiles
  set plan = p_plan_id,
      payment_status = 'confirmed',
      plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + interval '30 days'
  where id = p_vendor_id;

  get diagnostics updated_rows = row_count;
  if updated_rows <> 1 then
    return false;
  end if;

  update public.paystack_vendor_payments
  set status = 'success', paid_at = now()
  where reference = p_reference;

  return true;
end;
$$;

revoke all on function public.confirm_paystack_vendor_payment(text, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.confirm_paystack_vendor_payment(text, uuid, text, integer) to service_role;
