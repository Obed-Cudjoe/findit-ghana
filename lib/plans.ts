// Vendor subscription plans for the self-listing marketplace.
// Paid plans stay active while paymentStatus === "confirmed" AND planExpiresAt is in the future.
// After expiry (or before admin confirms MoMo) the vendor falls back to Free limits.
//
// Tiers: free (3) → starter (10, GH₵50/mo) → pro (25, GH₵100/mo) →
// unlimited (∞, GH₵200/mo OR GH₵500/year — annual saves GH₵1,900).
// Pricing is tuned for Ghana's 2026 reality: electricity tariffs jumped ~28%
// and SMEs operate on thin margins, so every tier must pay for itself with
// roughly one extra sale.
// The Unlimited tier is the top of the ladder: its listings outrank every other
// vendor (including featured / official catalogue results) and it carries the
// "∞ Unlimited" badge across the site.

export const PLAN_IDS = ["free", "starter", "pro", "unlimited"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Badge shown on Unlimited shops, product cards and the homepage featured strip. */
export const UNLIMITED_BADGE = "∞ Unlimited";

/** Sentinel for "no listing cap". Comparisons like `used >= cap` are never true. */
export const UNLIMITED_LISTINGS = Number.POSITIVE_INFINITY;

/** Paid tiers in ascending order — used to suggest the next upgrade. */
export const PAID_PLAN_ORDER: PlanId[] = ["starter", "pro", "unlimited"];

/** One-week featured boost for Free vendors — GH₵10 pins ONE listing to the
 *  top of its category for 7 days. Admin sets it after MoMo clears (the same
 *  featured_until mechanism as the monthly plans). */
export const WEEKLY_FEATURED_PRICE_GHS = 10;
export const WEEKLY_FEATURED_DAYS = 7;

export const PAYMENT_STATUSES = ["none", "pending", "confirmed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VENDOR_STATUSES = ["pending", "approved", "rejected"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  priceGhs: number;
  /** Billing cadence shown to vendors: "week" | "month" (annual is a variant of the month plan). */
  billingPeriod: "week" | "month";
  /** Annual option for this plan (Unlimited only). Vendors see the savings vs paying monthly. */
  yearlyPriceGhs?: number;
  /** Number.MAX-ish sentinel (UNLIMITED_LISTINGS) for the ∞ tier. */
  listingLimit: number;
  featuredRotation: boolean;
  homepageFeatured: boolean;
  stats: boolean;
  /** ∞ tier: no listing cap, top of search, "∞ Unlimited" badge everywhere. */
  unlimited: boolean;
  perks: string[];
}

/** What a vendor saves by paying yearly instead of monthly (cedis). */
export function yearlySavingsGhs(plan: PlanDef): number {
  if (!plan.yearlyPriceGhs) return 0;
  return plan.priceGhs * 12 - plan.yearlyPriceGhs;
}

/** The savings as a percentage, rounded — shown as "79% off". */
export function yearlySavingsPct(plan: PlanDef): number {
  if (!plan.yearlyPriceGhs) return 0;
  return Math.round((yearlySavingsGhs(plan) / (plan.priceGhs * 12)) * 100);
}

export const VENDOR_PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get found — up to three products",
    priceGhs: 0,
    billingPeriod: "month",
    listingLimit: 3,
    featuredRotation: false,
    homepageFeatured: false,
    stats: false,
    unlimited: false,
    perks: ["Up to 3 live listings", "WhatsApp buy button", "Reviewed before it goes live"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Be seen first in your category",
    priceGhs: 50,
    billingPeriod: "month",
    listingLimit: 10,
    featuredRotation: true,
    homepageFeatured: false,
    stats: false,
    unlimited: false,
    perks: ["Up to 10 listings", "★ Featured rotation in your category", "Verified shop badge after review"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Homepage shop + full stats",
    priceGhs: 100,
    billingPeriod: "month",
    listingLimit: 25,
    featuredRotation: true,
    homepageFeatured: true,
    stats: true,
    unlimited: false,
    perks: ["Up to 25 listings", "Homepage featured shop", "Per-vendor click & view stats", "★ Featured in every category you list"],
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    tagline: "Own the top of every search",
    priceGhs: 200,
    billingPeriod: "month",
    yearlyPriceGhs: 500,
    listingLimit: UNLIMITED_LISTINGS,
    featuredRotation: true,
    homepageFeatured: true,
    stats: true,
    unlimited: true,
    perks: [
      "Unlimited listings",
      "Ranked above every other vendor in search & categories",
      "∞ Unlimited badge on your shop and every product",
      "Homepage featured shop",
      "Per-vendor click & view stats",
    ],
  },
};

export const PLAN_LIST: PlanDef[] = [
  VENDOR_PLANS.free,
  VENDOR_PLANS.starter,
  VENDOR_PLANS.pro,
  VENDOR_PLANS.unlimited,
];

export const MOMO_NUMBER = "053 126 2424";
export const MOMO_NAME = "Obed Cudjoe";
export const MOMO_WHATSAPP = "233531262424";

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "starter" || v === "pro" || v === "unlimited";
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function isExpiryInFuture(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t > Date.now();
}

/** The plan the vendor actually enjoys right now (paid plans need confirmed + unexpired). */
export function effectivePlan(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
}): PlanId {
  if (profile.plan === "free") return "free";
  if (profile.paymentStatus !== "confirmed") return "free";
  if (!isExpiryInFuture(profile.planExpiresAt)) return "free";
  return profile.plan;
}

export function listingLimitFor(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): number {
  if (!profile) return VENDOR_PLANS.free.listingLimit;
  return VENDOR_PLANS[effectivePlan(profile)].listingLimit;
}

export function planHasCategoryFeatured(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return VENDOR_PLANS[effectivePlan(profile)].featuredRotation;
}

export function planHasHomepageFeatured(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return VENDOR_PLANS[effectivePlan(profile)].homepageFeatured;
}

export function planHasStats(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return VENDOR_PLANS[effectivePlan(profile)].stats;
}

/** True when the shop is on a live, confirmed, unexpired Unlimited plan. */
export function planHasUnlimited(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  return VENDOR_PLANS[effectivePlan(profile)].unlimited;
}

/** "∞" for the unlimited tier, otherwise the number. */
export function listingLimitLabel(limit: number): string {
  return Number.isFinite(limit) ? String(limit) : "∞";
}

/**
 * The next paid tier up from what the vendor enjoys right now, or null when
 * they are already on Unlimited (nothing left to upgrade to).
 */
export function nextPlanAfter(profile: {
  plan: PlanId;
  paymentStatus: PaymentStatus;
  planExpiresAt?: string | null;
} | null | undefined): PlanId | null {
  const current = effectivePlan(profile ?? { plan: "free", paymentStatus: "none", planExpiresAt: null });
  const i = PAID_PLAN_ORDER.indexOf(current);
  if (i === -1) return "starter";
  return PAID_PLAN_ORDER[i + 1] ?? null;
}

export function planBadgeLabel(plan: PlanId): string {
  return plan === "unlimited" ? UNLIMITED_BADGE : VENDOR_PLANS[plan].name;
}

/** Last-9-digit key so 024… / 23324… / +233 24… all match the same Ghana number. */
export function phoneKey(phone: string): string {
  return phone.replace(/[^0-9]/g, "").slice(-9);
}

export function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) % 360;
  return h;
}
