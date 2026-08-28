// Single data contract for the whole app — every component imports from here.
export interface Vendor {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  source: "direct" | "jumia" | "jiji" | "import";
  logoHue: number; // used by the gradient avatar
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  specs: Record<string, string>;
  gradient: string; // css gradient for the product tile (no external images needed)
  icon: string; // lucide icon name rendered on the tile
  canonicalUrl: string;
  updatedAt: string;
  isVendorListing?: boolean; // self-listed by a vendor (reviewed by admin before going live)
  featured?: boolean; // paid featured placement — sorted first, shown with a ★ badge
  unlimited?: boolean; // Unlimited plan (GH₵300/mo) — outranks featured, shown with an ∞ Unlimited badge
  image?: string; // product photo URL (served from the source CDN — tiles fall back to the gradient icon when absent)
}

export interface PriceOffer {
  id: string;
  productSlug: string;
  vendorId: string;
  priceGhs: number;
  stockCount: number | null;
  deliveryZone: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  deliveryFeeGhs: number;
  affiliateUrl: string;
  lastCheckedAt: string;
  active: boolean;
}

export interface PriceSnapshot {
  offerId: string;
  priceGhs: number;
  capturedAt: string; // ISO date
}

export interface Category {
  slug: string;
  name: string;
  icon: string;
  blurb: string;
  gradient: string;
}

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // markdown-lite: lines starting with ## are headings
  seoTitle: string;
  metaDescription: string;
  updatedAt: string;
  readMinutes: number;
  relatedProductSlugs: string[];
  gradient: string;
}

export interface ReportRow {
  id: string;
  refCode: string;
  kind: "price_error" | "stock_error" | "delivery_error" | "other" | "suspicious";
  listingUrl: string;
  vendorName: string;
  detail: string;
  reporterEmail: string;
  status: "new" | "checking" | "fixed" | "dismissed";
  createdAt: string;
}

export interface ContactRow {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
}

export interface ClickRow {
  id: string;
  productSlug: string;
  vendorName: string;
  destinationUrl: string;
  createdAt: string;
}

export type VendorPlanId = "free" | "starter" | "pro" | "unlimited";
export type VendorPaymentStatus = "none" | "pending" | "confirmed";
export type VendorProfileStatus = "pending" | "approved" | "rejected";

// One shop in the self-listing marketplace. Listings hang off this row.
export interface VendorProfile {
  id: string;
  businessName: string;
  slug: string;
  contactName: string;
  phone: string;
  email: string;
  websiteUrl: string;
  plan: VendorPlanId;
  planExpiresAt: string | null;
  paymentStatus: VendorPaymentStatus;
  momoReference: string;
  verified: boolean;
  logoHue: number;
  status: VendorProfileStatus;
  createdAt: string;
  // scrypt hash (`saltHex:keyHex`). Server-only — never send to the browser.
  passwordHash?: string | null;
}

// Self-submitted vendor listing (the "List your product" flow).
// status: pending (admin queue) → approved (appears on the site) | rejected.
export interface VendorListing {
  id: string;
  businessName: string;
  contactName: string;
  phone: string; // WhatsApp number shown to buyers
  email: string;
  productName: string;
  slug: string;
  category: string;
  priceGhs: number;
  stockCount: number | null;
  deliveryZone: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  deliveryFeeGhs: number;
  description: string;
  websiteUrl: string;
  // Product photos uploaded by the vendor (3–6 public URLs). Shown to buyers
  // on the product page, shop page and result cards before they contact.
  imageUrls?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  // Last time the vendor edited price / stock / delivery / description
  // (migration 007_vendor_listing_updates.sql). Older rows have no value —
  // freshness everywhere falls back to updatedAt ?? createdAt.
  updatedAt?: string;
  // Paid featured placement: listing is pinned to the top of its category and
  // badged while this ISO timestamp is in the future. Set by the admin after
  // the vendor pays (see the "Get featured" section on /for-vendors).
  featuredUntil?: string | null;
  vendorId?: string | null;
  requestedPlan?: VendorPlanId;
}
