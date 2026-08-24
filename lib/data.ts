// Read-side data access. In demo mode this serves the seed dataset directly;
// when Supabase env vars are present, lib/store.ts provides the same shapes
// from the database. The interface stays identical either way.
import { vendors, categories, products, offers, snapshots, guides } from "@/data/seed";
import type { Product, Vendor, PriceOffer, Category, Guide } from "@/lib/types";

export function getVendors(): Vendor[] {
  return vendors as unknown as Vendor[];
}

export function getVendor(id: string): Vendor | undefined {
  return getVendors().find((v) => v.id === id);
}

export function getCategories(): Category[] {
  return categories as unknown as Category[];
}

export function getCategory(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export function getProducts(): Product[] {
  return products as unknown as Product[];
}

export function getProduct(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function getOffers(): PriceOffer[] {
  return offers as unknown as PriceOffer[];
}

export function getOffersForProduct(slug: string): PriceOffer[] {
  return getOffers()
    .filter((o) => o.productSlug === slug && o.active)
    .sort((a, b) => a.priceGhs + a.deliveryFeeGhs - (b.priceGhs + b.deliveryFeeGhs));
}

export function getCheapestOffer(slug: string): PriceOffer | undefined {
  return getOffersForProduct(slug)[0];
}

export function getSnapshotsForOffer(offerId: string) {
  return (snapshots as unknown as { offerId: string; priceGhs: number; capturedAt: string }[])
    .filter((s) => s.offerId === offerId)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

export async function getGuides(): Promise<Guide[]> {
  // Merge admin-saved overrides (local files in dev, remote demo store on
  // Vercel, or the Supabase guides table in production) over the seed guides.
  const base = guides as unknown as Guide[];
  let overrides: { slug: string; excerpt: string; body: string }[] = [];
  try {
    const { readGuideOverrides } = await import("@/lib/store");
    overrides = await readGuideOverrides();
  } catch {
    overrides = [];
  }
  if (overrides.length === 0) return base;
  return base.map((g) => {
    const o = overrides.find((x) => x.slug === g.slug);
    return o ? { ...g, excerpt: o.excerpt, body: o.body } : g;
  });
}

export async function getGuide(slug: string): Promise<Guide | undefined> {
  const all = await getGuides();
  return all.find((g) => g.slug === slug);
}

export interface SearchResult {
  product: Product;
  offers: PriceOffer[];
  cheapest: PriceOffer | undefined;
}

// The site's core query: "price of X in Ghana".
// Token matching: every word in the query must appear in the text
// (so "samsung tv" matches "Samsung 43-inch Smart TV").
function matchesAllTokens(text: string, q: string): boolean {
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const lower = text.toLowerCase();
  return tokens.every((t) => lower.includes(t));
}

export function searchProducts(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getProducts()
    .filter((p) => matchesAllTokens(`${p.name} ${p.brand} ${p.category}`, q))
    .map((p) => {
      const offers = getOffersForProduct(p.slug);
      return { product: p, offers, cheapest: offers[0] };
    });
}

export function productsByCategory(categorySlug: string): SearchResult[] {
  return getProducts()
    .filter((p) => p.category === categorySlug)
    .map((p) => {
      const offers = getOffersForProduct(p.slug);
      return { product: p, offers, cheapest: offers[0] };
    });
}

export function searchSuggestions(query: string, limit = 6): { slug: string; name: string; category: string; minPriceGhs: number | null }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const results: { slug: string; name: string; category: string; minPriceGhs: number | null }[] = getProducts()
    .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q))
    .slice(0, limit)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      minPriceGhs: getOffersForProduct(p.slug)[0]?.priceGhs ?? null,
    }));
  if (results.length < limit) {
    for (const c of getCategories()) {
      if (results.length >= limit) break;
      if (c.name.toLowerCase().includes(q)) {
        results.push({ slug: c.slug, name: `All ${c.name}`, category: c.slug, minPriceGhs: null });
      }
    }
  }
  return results;
}

export const siteConfig = {
  name: "FindIt Ghana",
  tagline: "Ghana's price finder",
  description: "Find what it really costs in Ghana. Compare prices in cedis, live stock and delivery costs from named vendors — before you pay.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://findit-ghana.vercel.app",
  contactEmail: "cudjoe.obed.gh@gmail.com",
  contactPhone: "+233 53 126 2424",
  linkedinUrl: "https://www.linkedin.com/in/obed-cudjoe",
};

// ------------------------------------------------------------------
// Vendor self-listing support: approved listings become searchable
// products with a single offer (their own) and a WhatsApp buy link.
// ------------------------------------------------------------------
export async function getApprovedVendorListings() {
  try {
    const { readVendorListings } = await import("@/lib/store");
    const all = await readVendorListings();
    return all.filter((l) => l.status === "approved");
  } catch {
    return [];
  }
}

export function listingToProduct(l: {
  id: string; productName: string; slug: string; category: string; description: string; createdAt: string;
}): Product {
  const cat = getCategory(l.category);
  return {
    id: `vl-${l.id}`,
    name: l.productName,
    slug: l.slug,
    category: l.category,
    brand: "",
    specs: {},
    gradient: cat?.gradient ?? "linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)",
    icon: "package",
    canonicalUrl: "",
    updatedAt: l.createdAt,
    isVendorListing: true,
  };
}

export function listingToOffer(l: {
  id: string; slug: string; priceGhs: number; stockCount: number | null; deliveryZone: string;
  deliveryDaysMin: number; deliveryDaysMax: number; deliveryFeeGhs: number; phone: string; productName: string;
}): PriceOffer {
  const waText = encodeURIComponent(`Hello, I saw "${l.productName}" on FindIt Ghana for GH₵${l.priceGhs}. Is it available?`);
  const digits = l.phone.replace(/[^0-9]/g, "").replace(/^0/, "233");
  return {
    id: `vlo-${l.id}`,
    productSlug: l.slug,
    vendorId: `vlv-${l.id}`,
    priceGhs: l.priceGhs,
    stockCount: l.stockCount,
    deliveryZone: l.deliveryZone || "Ghana-wide",
    deliveryDaysMin: l.deliveryDaysMin || 1,
    deliveryDaysMax: l.deliveryDaysMax || 3,
    deliveryFeeGhs: l.deliveryFeeGhs || 0,
    affiliateUrl: `https://wa.me/${digits}?text=${waText}`,
    lastCheckedAt: new Date().toISOString(),
    active: true,
  };
}

export function listingToVendor(l: { id: string; businessName: string }): Vendor {
  return {
    id: `vlv-${l.id}`,
    name: l.businessName,
    slug: `vlv-${l.id}`,
    verified: false,
    source: "direct",
    logoHue: 200,
  };
}

// Async combined reads (seed + approved vendor listings) used by the
// public pages. Seed-only sync helpers above stay for build-time code.
export async function getAnyProduct(slug: string): Promise<{ product: Product; listing?: unknown } | undefined> {
  const seed = getProduct(slug);
  if (seed) return { product: seed };
  const listings = await getApprovedVendorListings();
  const l = listings.find((x) => x.slug === slug);
  if (!l) return undefined;
  return { product: listingToProduct(l), listing: l };
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const results = searchProducts(query);
  const listings = await getApprovedVendorListings();
  const q = query.toLowerCase().trim();
  for (const l of listings) {
    if (matchesAllTokens(`${l.productName} ${l.businessName} ${l.category}`, q)) {
      const product = listingToProduct(l);
      results.unshift({ product, offers: [listingToOffer(l)], cheapest: listingToOffer(l) });
    }
  }
  return results;
}

export async function categoryResultsAll(categorySlug: string): Promise<SearchResult[]> {
  const results = productsByCategory(categorySlug);
  const listings = await getApprovedVendorListings();
  for (const l of listings) {
    if (l.category === categorySlug) {
      const product = listingToProduct(l);
      results.push({ product, offers: [listingToOffer(l)], cheapest: listingToOffer(l) });
    }
  }
  return results;
}
