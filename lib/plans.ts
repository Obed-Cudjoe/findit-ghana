// Vendor subscription plans for the self-listing marketplace.
// Paid plans stay active while paymentStatus === "confirmed" AND planExpiresAt is in the future.
// After expiry (or before admin confirms MoMo) the vendor falls back to Free limits.
//
// Launch tiers: Free (3) → Starter (10, GH₵30/mo) → Pro (25, GH₵50/mo) →
// Growth (50, GH₵70/mo). These are introductory prices while FindIt grows its seller base.
// The legacy database plan key "unlimited" is retained for the Growth tier to avoid
// requiring a live database migration; the plan itself is capped at 50 listings and
// does not receive unlimited placement or an infinity badge.

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
  /** Optional annual price, if offered for a tier. */
  yearlyPriceGhs?: number;
  /** Number.MAX-ish sentinel (UNLIMITED_LISTINGS) for a genuinely uncapped tier. */
  listingLimit: number;
  featuredRotation: boolean;
  homepageFeatured: boolean;
  stats: boolean;
  /** True only for a genuinely uncapped tier with special placement/badge. */
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
    tagline: "A low-cost step up for growing sellers",
    priceGhs: 30,
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
    tagline: "More listings, shop stats and homepage featuring",
    priceGhs: 50,
    billingPeriod: "month",
    listingLimit: 25,
    featuredRotation: true,
    homepageFeatured: true,
    stats: true,
    unlimited: false,
    perks: ["Up to 25 listings", "Homepage featured shop", "Per-vendor click & view stats", "★ Featured rotation in your categories"],
  },
  unlimited: {
    id: "unlimited",
    name: "Growth",
    tagline: "More room for a growing product catalogue",
    priceGhs: 70,
    billingPeriod: "month",
    listingLimit: 50,
    featuredRotation: true,
    homepageFeatured: true,
    stats: true,
    unlimited: false,
    perks: [
      "Up to 50 listings",
      "Homepage featured shop",
      "Per-vendor click & view stats",
      "★ Featured rotation in your categories",
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

/** True only for a live, confirmed, unexpired plan that grants uncapped placement. */
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
 * they are already on the highest paid tier (nothing left to upgrade to).
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
  return VENDOR_PLANS[plan].name;
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
