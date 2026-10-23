import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { PlanId } from "@/lib/plans";
import { VENDOR_PLANS, isPlanId } from "@/lib/plans";
import {
  createPendingPaystackPayment,
  findPaystackPaymentByReference,
  markPaystackPaymentFailed,
  confirmPaystackPaymentAtomically,
} from "@/lib/store";
import type { VendorProfile } from "@/lib/types";

const PAYSTACK_API = "https://api.paystack.co";

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

export function siteBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function initializeVendorCheckout(profile: VendorProfile): Promise<
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; error: string }
> {
  const secret = paystackSecret();
  if (!secret) return { ok: false, error: "Paystack is not configured yet. Please contact FindIt Ghana support." };
  if (!isPlanId(profile.plan) || profile.plan === "free") {
    return { ok: false, error: "Choose a paid plan before starting checkout." };
  }
  if (!profile.email) return { ok: false, error: "Add an email address to your shop profile before paying with Paystack." };

  const plan: PlanId = profile.plan;
  const priceGhs = VENDOR_PLANS[plan].priceGhs;
  const amountPesewas = Math.round(priceGhs * 100);
  const reference = `findit_${randomUUID()}`;
  const created = await createPendingPaystackPayment({
    reference,
    vendorId: profile.id,
    planId: plan,
    amountPesewas,
  });
  if (!created) {
    return { ok: false, error: "Online payment storage is not ready. Please contact FindIt Ghana support." };
  }

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: profile.email,
        amount: String(amountPesewas),
        currency: "GHS",
        reference,
        callback_url: `${siteBaseUrl()}/api/payments/paystack/callback`,
        metadata: {
          vendor_id: profile.id,
          vendor_slug: profile.slug,
          plan_id: plan,
          plan_name: VENDOR_PLANS[plan].name,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json().catch(() => null)) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    } | null;

    if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
      await markPaystackPaymentFailed(reference);
      return { ok: false, error: "Paystack could not start checkout. Please try again or contact support." };
    }

    return { ok: true, authorizationUrl: payload.data.authorization_url, reference };
  } catch {
    await markPaystackPaymentFailed(reference);
    return { ok: false, error: "Could not reach Paystack. Check your connection and try again." };
  }
}

export type PaymentVerification = "confirmed" | "pending" | "invalid";

type PaystackVerifyResponse = {
  status?: boolean;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, unknown> | string | null;
  };
};

/** Verify with Paystack from the server, then atomically activate the 30-day plan. */
export async function verifyAndActivateVendorPayment(reference: string): Promise<PaymentVerification> {
  const secret = paystackSecret();
  if (!secret || !reference || reference.length > 100) return "invalid";

  const payment = await findPaystackPaymentByReference(reference);
  if (!payment) return "invalid";
  if (payment.status === "success") return "confirmed";
  if (payment.status !== "pending") return "invalid";

  let payload: PaystackVerifyResponse | null = null;

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    payload = (await response.json().catch(() => null)) as PaystackVerifyResponse | null;
    if (!response.ok || !payload?.status || !payload.data) return "pending";
  } catch {
    return "pending";
  }

  const data = payload.data;
  if (data.status !== "success") return "pending";

  let metadata: Record<string, unknown> = {};
  if (typeof data.metadata === "string") {
    try { metadata = JSON.parse(data.metadata) as Record<string, unknown>; } catch { return "invalid"; }
  } else if (data.metadata && typeof data.metadata === "object") {
    metadata = data.metadata;
  }

  const matches =
    data.reference === payment.reference &&
    Number(data.amount) === payment.amountPesewas &&
    data.currency === "GHS" &&
    metadata.vendor_id === payment.vendorId &&
    metadata.plan_id === payment.planId &&
    isPlanId(payment.planId) && payment.planId !== "free" &&
    payment.amountPesewas === Math.round(VENDOR_PLANS[payment.planId].priceGhs * 100);

  if (!matches) {
    await markPaystackPaymentFailed(reference);
    return "invalid";
  }

  const confirmed = await confirmPaystackPaymentAtomically({
    reference: payment.reference,
    vendorId: payment.vendorId,
    planId: payment.planId,
    amountPesewas: payment.amountPesewas,
  });
  return confirmed ? "confirmed" : "pending";
}

export function isValidPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = paystackSecret();
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
