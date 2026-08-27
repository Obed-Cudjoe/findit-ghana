// Vendor subscription plans for the self-listing marketplace.
// Paid plans stay active while paymentStatus === "confirmed" AND planExpiresAt is in the future.
// After expiry (or before admin confirms MoMo) the vendor falls back to Free limits.

export const PLAN_IDS = ["free", "starter", "pro"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PAYMENT_STATUSES = ["none", "pending", "confirmed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VENDOR_STATUSES = ["pending", "approved", "rejected"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  priceGhs: number;
  listingLimit: number;
  featuredRotation: boolean;
  homepageFeatured: boolean;
  stats: boolean;
  perks: string[];
}

export const VENDOR_PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Get found — one product",
    priceGhs: 0,
    listingLimit: 1,
    featuredRotation: false,
    homepageFeatured: false,
    stats: false,
    perks: ["1 live listing", "WhatsApp buy button", "Reviewed before it goes live"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Be seen first in your category",
    priceGhs: 50,
    listingLimit: 3,
    featuredRotation: true,
    homepageFeatured: false,
    stats: false,
    perks: ["Up to 3 listings", "★ Featured rotation in your category", "Verified shop badge after review"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Homepage shop + full stats",
    priceGhs: 150,
    listingLimit: 10,
    featuredRotation: true,
    homepageFeatured: true,
    stats: true,
    perks: ["Up to 10 listings", "Homepage featured shop", "Per-vendor click & view stats", "★ Featured in every category you list"],
  },
};

export const PLAN_LIST: PlanDef[] = [VENDOR_PLANS.free, VENDOR_PLANS.starter, VENDOR_PLANS.pro];

export const MOMO_NUMBER = "053 126 2424";
export const MOMO_NAME = "Obed Cudjoe";
export const MOMO_WHATSAPP = "233531262424";

export function isPlanId(v: unknown): v is PlanId {
  return v === "free" || v === "starter" || v === "pro";
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
