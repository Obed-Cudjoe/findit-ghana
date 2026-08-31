// Read-side data access. The product catalogue is the real Jumia Ghana
// marketplace snapshot plus official partner catalogues (CompuGhana,
// Franko Trading, Telefonika). Categories and guides stay in the seed file;
// vendor listings from the self-service flow merge on top.
import { vendors as seedVendors, categories, guides } from "@/data/seed";
import { jumiaProducts, jumiaOffers, jumiaVendor, jumiaCatalogMeta } from "@/lib/feeds/jumia";
import { compughanaProducts, compughanaOffers, compughanaVendor, compughanaCatalogMeta } from "@/lib/feeds/compughana";
import { frankoProducts, frankoOffers, frankoVendor, frankoCatalogMeta } from "@/lib/feeds/franko";
import { telefonikaProducts, telefonikaOffers, telefonikaVendor, telefonikaCatalogMeta } from "@/lib/feeds/telefonika";
import type { Product, Vendor, PriceOffer, Category, Guide, VendorListing, VendorProfile } from "@/lib/types";
import { namesLikelySame, findMatchingProduct } from "@/lib/product-match";
import { phoneKey, planHasCategoryFeatured, planHasHomepageFeatured, planHasStats, planHasUnlimited } from "@/lib/plans";

const demoVendors = seedVendors as unknown as Vendor[];

// Marketplace (self-listed) vendors are registered here as listings load so
// ProductCard / getVendor() can resolve them the same way as catalogue shops.
const marketplaceVendorCache = new Map<string, Vendor>();

export function cacheMarketplaceVendor(v: Vendor) {
  marketplaceVendorCache.set(v.id, v);
}

export const officialSources: {
  id: string;
  name: string;
  host: string;
  search: string;
  blurb: string;
  productPrefix: string;
  catalogFetchedAt: string;
}[] = [
  { id: "jumia", name: "Jumia Ghana", host: "jumia.com.gh", search: "jumia", blurb: "Marketplace listings with JumiaPay escrow.", productPrefix: "jm-", catalogFetchedAt: jumiaCatalogMeta().fetchedAt },
  { id: "compughana", name: "CompuGhana", host: "compughana.com", search: "compughana", blurb: "Authorised Apple, Samsung and HP reseller.", productPrefix: "cg-", catalogFetchedAt: compughanaCatalogMeta().fetchedAt },
  { id: "franko", name: "Franko Trading", host: "frankotrading.com", search: "franko", blurb: "High-street electronics chain — free Accra & Kumasi delivery.", productPrefix: "ft-", catalogFetchedAt: frankoCatalogMeta().fetchedAt },
  { id: "telefonika", name: "Telefonika", host: "telefonika.com", search: "telefonika", blurb: "Phone specialist with stores across Ghana.", productPrefix: "tf-", catalogFetchedAt: telefonikaCatalogMeta().fetchedAt },
];

export function getVendors(): Vendor[] {
  // Official price sources first, then named local vendors used by the
  // vendor-listing flow and demo comparisons, then live marketplace shops.
  const out: Vendor[] = [];
  const seen = new Set<string>();
  for (const v of [jumiaVendor, compughanaVendor, frankoVendor, telefonikaVendor, ...demoVendors, ...marketplaceVendorCache.values()]) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    out.push(v);
  }
  return out;
}

export function getVendor(id: string): Vendor | undefined {
  return getVendors().find((v) => v.id === id) ?? marketplaceVendorCache.get(id);
}

export function getVendorBySlug(slug: string): Vendor | undefined {
  return getVendors().find((v) => v.slug === slug);
}

export function getCategories(): Category[] {
  return categories as unknown as Category[];
}

export function getCategory(slug: string): Category | undefined {
  return getCategories().find((c) => c.slug === slug);
}

export function getProducts(): Product[] {
  return [...jumiaProducts(), ...compughanaProducts(), ...frankoProducts(), ...telefonikaProducts()];
}

export function getProduct(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

const JUMIA_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_JUMIA_AFFILIATE_URL?.trim() || "https://jforce.jumia.com.gh/s/YKEXEt5";

function isJumiaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "jumia.com.gh" || host.endsWith(".jumia.com.gh");
  } catch {
    return false;
  }
}

function withAffiliateLink(offer: PriceOffer): PriceOffer {
  if (!isJumiaUrl(offer.affiliateUrl)) return offer;
  return { ...offer, affiliateUrl: JUMIA_AFFILIATE_URL };
}

export function getOffers(): PriceOffer[] {
  return [...jumiaOffers(), ...compughanaOffers(), ...frankoOffers(), ...telefonikaOffers()].map(withAffiliateLink);
}

export function getOffersForProduct(slug: string): PriceOffer[] {
  return getOffers()
    .filter((o) => o.productSlug === slug && o.active)
    .sort((a, b) => a.priceGhs + a.deliveryFeeGhs - (b.priceGhs + b.deliveryFeeGhs));
}

export function getCheapestOffer(slug: string): PriceOffer | undefined {
  return getOffersForProduct(slug)[0];
}

export function getSnapshotsForOffer(offerId: string): { offerId: string; priceGhs: number; capturedAt: string }[] {
  // Real-catalogue offers start with a single price observation (the live
  // scrape); the 12-week history accumulates as the daily /api/refresh cron
  // records snapshots (Supabase mode) over time.
  return [];
}

// Async variant used by the product page: reads the accumulated snapshot
// history from Supabase once the daily cron has recorded observations.
export async function loadSnapshotsForOffer(
  offerId: string
): Promise<{ offerId: string; priceGhs: number; capturedAt: string }[]> {
  const local = getSnapshotsForOffer(offerId);
  if (local.length > 0) return local;
  try {
    const { readOfferSnapshots } = await import("@/lib/store");
    return await readOfferSnapshots(offerId);
  } catch {
    return [];
  }
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

function vendorNamesFor(product: Product): string {
  const vendors = getVendors();
  return getOffers()
    .filter((o) => o.productSlug === product.slug && o.active)
    .map((o) => vendors.find((v) => v.id === o.vendorId)?.name ?? "")
    .join(" ");
}

export function searchProducts(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return getProducts()
    .filter((p) => matchesAllTokens(`${p.name} ${p.brand} ${p.category} ${vendorNamesFor(p)}`, q))
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
    .filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category} ${vendorNamesFor(p)}`.toLowerCase();
      return hay.includes(q) || matchesAllTokens(hay, q);
    })
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

// Autocomplete for the live search bars — catalogue suggestions PLUS approved
// independent vendor listings (the reason a vendor product "took time to show
// up" was that suggestions only covered the catalogue). Ranked: exact prefix
// matches first, then includes, then token matches; vendor name shown so
// shoppers recognise the shop they were looking for.
export async function searchSuggestionsAll(
  query: string,
  limit = 8
): Promise<{ slug: string; name: string; category: string; minPriceGhs: number | null; vendorName?: string }[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const base = searchSuggestions(query, limit);

  const { listings } = await getMarketplaceState();
  const withVendors: { slug: string; name: string; category: string; minPriceGhs: number | null; vendorName?: string; rank: number }[] = base.map((s) => ({
    ...s,
    rank: s.name.toLowerCase().startsWith(q) ? 0 : s.name.toLowerCase().includes(q) ? 1 : 2,
  }));

  for (const l of listings) {
    const hay = `${l.productName} ${l.businessName} ${l.category}`.toLowerCase();
    if (!(hay.includes(q) || matchesAllTokens(hay, q))) continue;
    const rank = l.productName.toLowerCase().startsWith(q) ? 0 : l.productName.toLowerCase().includes(q) ? 1 : 2;
    withVendors.push({
      slug: l.slug,
      name: l.productName,
      category: l.category,
      minPriceGhs: l.priceGhs,
      vendorName: l.businessName,
      rank,
    });
  }

  return withVendors
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ slug, name, category, minPriceGhs, vendorName }) => ({ slug, name, category, minPriceGhs, vendorName }));
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
// products with a WhatsApp buy link. Same-named listings from different
// shops (and listings that match a catalogue product) merge onto one
// product page so the vendor comparison table shows every offer.
// ------------------------------------------------------------------
export async function getApprovedVendorListings(): Promise<VendorListing[]> {
  try {
    const { readVendorListings } = await import("@/lib/store");
    const all = await readVendorListings();
    return all.filter((l) => l.status === "approved");
  } catch {
    return [];
  }
}

export async function getMarketplaceState(): Promise<{ listings: VendorListing[]; profiles: VendorProfile[] }> {
  try {
    const { readVendorListings, readVendorProfiles } = await import("@/lib/store");
    const [all, profiles] = await Promise.all([readVendorListings(), readVendorProfiles()]);
    // Approved only, minus stale listings (vendors must re-confirm; after
    // STALE_DAYS without a touch the listing drops out of public views —
    // this is what keeps "call and be told it's sold" off FindIt Ghana).
    return { listings: all.filter((l) => l.status === "approved" && !isListingStale(l)), profiles };
  } catch {
    return { listings: [], profiles: [] };
  }
}

// ------------------------------------------------------------------
// Freshness enforcement — the honest-data system. Every listing shows how
// long ago the vendor confirmed it; stale listings disappear from public
// pages and the vendor dashboard asks for a re-confirm.
// ------------------------------------------------------------------
export const STALE_DAYS = 60;
export const RECONFIRM_NUDGE_DAYS = 14;

export function listingDaysSinceConfirm(l: { updatedAt?: string; createdAt: string }): number {
  const base = l.updatedAt ?? l.createdAt;
  const days = Math.floor((Date.now() - new Date(base).getTime()) / 86_400_000);
  return Math.max(0, days);
}

export function isListingStale(l: { updatedAt?: string; createdAt: string }): boolean {
  return listingDaysSinceConfirm(l) > STALE_DAYS;
}

// ------------------------------------------------------------------
// Vendor trust score — one number out of 5, computed from real signals.
//   verified shop          +2
//   social link present    +1
//   no unresolved reports  +2
//   confirmed ≤7 days ago  +1
//   paid placement         +1   (capped at 5)
// ------------------------------------------------------------------
export function vendorTrustScore(opts: {
  verified: boolean;
  hasSocial: boolean;
  unresolvedReports: number;
  daysSinceConfirm: number;
  hasPaidPlacement: boolean;
}): number {
  let pts = 0;
  if (opts.verified) pts += 2;
  if (opts.hasSocial) pts += 1;
  if (opts.unresolvedReports === 0) pts += 2;
  if (opts.daysSinceConfirm <= 7) pts += 1;
  if (opts.hasPaidPlacement) pts += 1;
  return Math.max(0, Math.min(5, pts));
}

// ------------------------------------------------------------------
// Homepage "What Ghana is searching for" picks.
// 1. One product per official shop, ROTATING daily — a deterministic
//    day-based offset walks through each catalogue so the strip shows
//    different products every day (stable within a day, no randomness).
// 2. Up to 2 independent vendor listings — featured listings first,
//    then the newest approved ones. Vendors earn homepage presence
//    simply by being approved (and Pro/Unlimited get priority).
// ------------------------------------------------------------------
export async function getHomepagePicks(): Promise<SearchResult[]> {
  const day = Math.floor(Date.now() / 86_400_000);

  const official = officialSources
    .map((source, si) => {
      const pool = getProducts().filter((p) => p.id.startsWith(source.productPrefix));
      if (pool.length === 0) return undefined;
      // spread each source's pick with a different offset so they rotate
      // independently instead of all stepping together
      const idx = (day * 7 + si * 13) % pool.length;
      const product = pool[idx];
      const offers = getOffersForProduct(product.slug);
      return { product, offers, cheapest: offers[0] } as SearchResult;
    })
    .filter((r): r is SearchResult => Boolean(r));

  const { listings, profiles } = await getMarketplaceState();
  const now = Date.now();
  const sorted = [...listings].sort((a, b) => {
    const fa = a.featuredUntil ? new Date(a.featuredUntil).getTime() > now : false;
    const fb = b.featuredUntil ? new Date(b.featuredUntil).getTime() > now : false;
    if (fa !== fb) return fa ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const independent = sorted.slice(0, 2).map((l) => {
    const profile = profileForListing(l, profiles);
    const vendor = listingToVendor(l, profile);
    const product = listingToProduct(l);
    const offer = listingToOffer(l, l.slug, vendor.id);
    return { product, offers: [offer], cheapest: offer } as SearchResult;
  });

  return [...official, ...independent];
}

export function profileForListing(l: VendorListing, profiles: VendorProfile[]): VendorProfile | undefined {
  if (l.vendorId) {
    const byId = profiles.find((p) => p.id === l.vendorId);
    if (byId) return byId;
  }
  const key = phoneKey(l.phone);
  if (!key) return undefined;
  return profiles.find((p) => phoneKey(p.phone) === key);
}

// A listing is featured while its paid window (featuredUntil) is in the future,
// or while the shop's Starter/Pro/Unlimited plan is active (category rotation).
export function isListingFeatured(l: { featuredUntil?: string | null }): boolean {
  return !!l.featuredUntil && new Date(l.featuredUntil).getTime() > Date.now();
}

export function listingHasFeaturedPlacement(l: VendorListing, profile?: VendorProfile | null): boolean {
  return isListingFeatured(l) || planHasCategoryFeatured(profile);
}

/**
 * Top of the ladder: the shop is on a live Unlimited plan (GH₵300/month).
 * These listings outrank every other vendor — including ★ featured ones —
 * in search and category results.
 */
export function listingHasUnlimitedPlacement(_l: VendorListing, profile?: VendorProfile | null): boolean {
  return planHasUnlimited(profile);
}

function byTotalCost(a: PriceOffer, b: PriceOffer): number {
  return a.priceGhs + a.deliveryFeeGhs - (b.priceGhs + b.deliveryFeeGhs);
}

export function listingToProduct(l: {
  id: string; productName: string; slug: string; category: string; description: string; createdAt: string;
  updatedAt?: string; featuredUntil?: string | null; imageUrls?: string[];
}, featured = isListingFeatured(l), unlimited = false): Product {
  const cat = getCategory(l.category);
  const firstPhoto = l.imageUrls?.find((u) => typeof u === "string" && u.length > 0);
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
    // Freshness: vendor-edited listings show when the price was last changed;
    // rows created before migration 007 (or never edited) fall back to createdAt.
    updatedAt: l.updatedAt ?? l.createdAt,
    isVendorListing: true,
    featured,
    unlimited,
    // Vendor photos replace the gradient tile everywhere product cards render
    // (search, categories, the shop page, "shoppers also compared").
    image: firstPhoto,
  };
}

export function listingToVendor(
  l: { id: string; businessName: string; vendorId?: string | null },
  profile?: VendorProfile | null,
): Vendor {
  const id = profile?.id ? `vp-${profile.id}` : l.vendorId ? `vp-${l.vendorId}` : `vlv-${l.id}`;
  const v: Vendor = {
    id,
    name: profile?.businessName ?? l.businessName,
    slug: profile?.slug ?? `vlv-${l.id}`,
    verified: profile?.verified ?? false,
    source: "direct",
    logoHue: profile?.logoHue ?? 200,
  };
  cacheMarketplaceVendor(v);
  return v;
}

export function listingToOffer(
  l: {
    id: string; slug: string; priceGhs: number; stockCount: number | null; deliveryZone: string;
    deliveryDaysMin: number; deliveryDaysMax: number; deliveryFeeGhs: number; phone: string; productName: string;
    businessName: string; vendorId?: string | null;
  },
  productSlug = l.slug,
  vendorId?: string,
): PriceOffer {
  const waText = encodeURIComponent(`Hello, I saw "${l.productName}" on FindIt Ghana for GH₵${l.priceGhs}. Is it available?`);
  const digits = l.phone.replace(/[^0-9]/g, "").replace(/^0/, "233");
  const vendor = vendorId ?? listingToVendor(l).id;
  return {
    id: `vlo-${l.id}`,
    productSlug,
    vendorId: vendor,
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

/**
 * Result order: Unlimited shops first (they outrank everything, including
 * featured/official results), then ★ featured listings on their daily rotation,
 * then everything else.
 */
function rankResultsFirst(results: SearchResult[]): SearchResult[] {
  const unlimited = results.filter((r) => r.product.unlimited);
  const featured = results.filter((r) => !r.product.unlimited && r.product.featured);
  const rest = results.filter((r) => !r.product.unlimited && !r.product.featured);
  const rotated =
    featured.length <= 1
      ? featured
      : (() => {
          const offset = Math.floor(Date.now() / 86_400_000) % featured.length;
          return [...featured.slice(offset), ...featured.slice(0, offset)];
        })();
  return [...unlimited, ...rotated, ...rest];
}

function offerForListing(
  l: VendorListing,
  profiles: VendorProfile[],
  productSlug: string,
): { offer: PriceOffer; featured: boolean; unlimited: boolean } {
  const profile = profileForListing(l, profiles);
  const vendor = listingToVendor(l, profile);
  return {
    offer: listingToOffer(l, productSlug, vendor.id),
    featured: listingHasFeaturedPlacement(l, profile),
    unlimited: listingHasUnlimitedPlacement(l, profile),
  };
}

/** Merge matching vendor listings onto catalogue results; leftover listings cluster together. */
function mergeListingsIntoResults(
  results: SearchResult[],
  listings: VendorListing[],
  profiles: VendorProfile[],
): SearchResult[] {
  const used = new Set<string>();
  const catalogue = getProducts();

  for (const l of listings) {
    const inResults = results.find((r) => r.product.category === l.category && namesLikelySame(r.product.name, l.productName));
    const target = inResults ?? (() => {
      const cat = findMatchingProduct(l.productName, l.category, catalogue);
      if (!cat) return undefined;
      const existing = results.find((r) => r.product.slug === cat.slug);
      if (existing) return existing;
      const offers = getOffersForProduct(cat.slug);
      const added: SearchResult = { product: cat, offers, cheapest: offers[0] };
      results.push(added);
      return added;
    })();
    if (!target) continue;
    const { offer, featured, unlimited } = offerForListing(l, profiles, target.product.slug);
    if (!target.offers.some((o) => o.id === offer.id)) {
      target.offers = [...target.offers, offer].sort(byTotalCost);
      target.cheapest = target.offers[0];
    }
    if (featured && !target.product.featured) {
      target.product = { ...target.product, featured: true };
    }
    if (unlimited && !target.product.unlimited) {
      target.product = { ...target.product, unlimited: true };
    }
    used.add(l.id);
  }

  const leftover = listings.filter((l) => !used.has(l.id));
  const clusters: VendorListing[][] = [];
  for (const l of leftover) {
    const cluster = clusters.find((c) => c[0].category === l.category && namesLikelySame(c[0].productName, l.productName));
    if (cluster) cluster.push(l);
    else clusters.push([l]);
  }
  for (const cluster of clusters) {
    const canonical = [...cluster].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    const offers = cluster
      .map((l) => offerForListing(l, profiles, canonical.slug).offer)
      .sort(byTotalCost);
    const featured = cluster.some((l) => listingHasFeaturedPlacement(l, profileForListing(l, profiles)));
    const unlimited = cluster.some((l) => listingHasUnlimitedPlacement(l, profileForListing(l, profiles)));
    results.push({
      product: listingToProduct(canonical, featured, unlimited),
      offers,
      cheapest: offers[0],
    });
  }
  return rankResultsFirst(results);
}

// Async combined reads (seed + approved vendor listings) used by the
// public pages. Seed-only sync helpers above stay for build-time code.
export async function getAnyProduct(slug: string): Promise<{ product: Product; listing?: unknown } | undefined> {
  const page = await getMergedProductPage(slug);
  if (!page) return undefined;
  return { product: page.product, listing: page.listing };
}

export interface MergedProductPage {
  product: Product;
  offers: PriceOffer[];
  vendors: Vendor[];
  listing?: VendorListing;
  listings: VendorListing[];
  isCatalogue: boolean;
}

export async function getMergedProductPage(slug: string): Promise<MergedProductPage | undefined> {
  const { listings, profiles } = await getMarketplaceState();
  const catalogue = getProduct(slug);
  const listingBySlug = listings.find((l) => l.slug === slug);
  if (!catalogue && !listingBySlug) return undefined;

  const name = catalogue?.name ?? listingBySlug!.productName;
  const category = catalogue?.category ?? listingBySlug!.category;
  const catalogueMatch = catalogue ?? findMatchingProduct(name, category, getProducts());
  const matchingListings = listings.filter((l) => l.category === category && namesLikelySame(name, l.productName));

  const canonicalListing = matchingListings.length
    ? [...matchingListings].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
    : listingBySlug;

  const featured = matchingListings.some((l) => listingHasFeaturedPlacement(l, profileForListing(l, profiles)));
  const unlimited = matchingListings.some((l) => listingHasUnlimitedPlacement(l, profileForListing(l, profiles)));
  const product: Product = catalogueMatch
    ? { ...catalogueMatch, featured: featured || catalogueMatch.featured, unlimited: unlimited || catalogueMatch.unlimited }
    : listingToProduct(canonicalListing ?? listingBySlug!, featured, unlimited);

  const listingOffers = matchingListings.map((l) => offerForListing(l, profiles, product.slug).offer);
  const catalogueOffers = catalogueMatch ? getOffersForProduct(catalogueMatch.slug) : [];
  const offers = [...catalogueOffers, ...listingOffers].sort(byTotalCost);

  const extraVendors = matchingListings.map((l) => listingToVendor(l, profileForListing(l, profiles)));
  const vendors: Vendor[] = [];
  const seen = new Set<string>();
  for (const v of [...getVendors(), ...extraVendors]) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    vendors.push(v);
  }

  return {
    product,
    offers,
    vendors,
    listing: listingBySlug ?? (catalogueMatch ? undefined : canonicalListing),
    listings: matchingListings,
    isCatalogue: !!catalogueMatch,
  };
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const results = searchProducts(query);
  const { listings, profiles } = await getMarketplaceState();
  const q = query.toLowerCase().trim();
  const matched = listings.filter((l) => matchesAllTokens(`${l.productName} ${l.businessName} ${l.category}`, q));
  return mergeListingsIntoResults(results, matched, profiles);
}

// ------------------------------------------------------------------
// F02/F03 — filters + sort (server-side, query-param driven)
// ------------------------------------------------------------------
export interface SearchOptions {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  verifiedOnly?: boolean;
  zone?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest";
}

export async function searchWithOptions(query: string, opts: SearchOptions): Promise<SearchResult[]> {
  // No query: browse everything (so filters work standalone, e.g. brand=Tecno
  // with an empty search box). With a query: normal search.
  let results: SearchResult[];
  if (!query.trim()) {
    results = getProducts().map((p) => {
      const offers = getOffersForProduct(p.slug);
      return { product: p, offers, cheapest: offers[0] };
    });
    const { listings, profiles } = await getMarketplaceState();
    results = mergeListingsIntoResults(results, listings, profiles);
  } else {
    results = await searchAll(query);
  }

  // Filter by brand (name or brand field)
  if (opts.brand) {
    const b = opts.brand.toLowerCase();
    results = results.filter(
      (r) => r.product.brand.toLowerCase().includes(b) || r.product.name.toLowerCase().includes(b)
    );
  }

  // Filter by total price range (price + delivery fee = what the buyer pays)
  if (opts.minPrice !== undefined) {
    results = results.filter((r) => r.cheapest && r.cheapest.priceGhs + r.cheapest.deliveryFeeGhs >= opts.minPrice!);
  }
  if (opts.maxPrice !== undefined) {
    results = results.filter((r) => r.cheapest && r.cheapest.priceGhs + r.cheapest.deliveryFeeGhs <= opts.maxPrice!);
  }

  // In-stock only
  if (opts.inStockOnly) {
    results = results.filter((r) => r.cheapest && (r.cheapest.stockCount ?? 0) > 0);
  }

  // Verified vendors only (official shops are always verified)
  if (opts.verifiedOnly) {
    const vendors = getVendors();
    results = results.filter(
      (r) => !r.cheapest || (vendors.find((v) => v.id === r.cheapest!.vendorId)?.verified ?? false)
    );
  }

  // Delivery zone (matches the cheapest offer's zone)
  if (opts.zone) {
    const z = opts.zone.toLowerCase();
    results = results.filter((r) => r.cheapest && r.cheapest.deliveryZone.toLowerCase().includes(z));
  }

  // Sort
  switch (opts.sort) {
    case "price-asc":
      results.sort((a, b) => (a.cheapest?.priceGhs ?? Infinity) - (b.cheapest?.priceGhs ?? Infinity));
      break;
    case "price-desc":
      results.sort((a, b) => (b.cheapest?.priceGhs ?? -Infinity) - (a.cheapest?.priceGhs ?? -Infinity));
      break;
    case "newest":
      results.sort((a, b) => new Date(b.product.updatedAt).getTime() - new Date(a.product.updatedAt).getTime());
      break;
    default:
      break; // relevance = natural order
  }

  return results;
}

// Distinct brands + zones present in the catalogue — powers the filter UI.
export function getBrandOptions(): string[] {
  const brands = new Set<string>();
  for (const p of getProducts()) if (p.brand && p.brand.trim()) brands.add(p.brand.trim());
  return [...brands].sort((a, b) => a.localeCompare(b));
}

export function getZoneOptions(): string[] {
  const zones = new Set<string>();
  for (const o of getOffers()) if (o.active && o.deliveryZone) zones.add(o.deliveryZone);
  return [...zones].sort((a, b) => a.localeCompare(b));
}

// F01 typo tolerance: "did you mean" — returns the best candidate when the
// query has zero results. Uses a light edit-distance check (≤2 characters)
// against product names, brands and categories.
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export function didYouMean(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (q.length < 3) return null;
  let best: { term: string; distance: number } | null = null;
  const candidates = new Set<string>();
  for (const p of getProducts()) {
    for (const word of p.name.toLowerCase().split(/[\s()\/-]+/)) {
      if (word.length >= 3) candidates.add(word);
    }
    candidates.add(p.name.toLowerCase());
    if (p.brand) candidates.add(p.brand.toLowerCase());
  }
  for (const c of getCategories()) candidates.add(c.name.toLowerCase());
  for (const cand of candidates) {
    // word must share the first letter (cheap + effective for typos)
    if (cand[0] !== q[0]) continue;
    const d = Math.min(editDistance(q, cand), editDistance(q.split(" ")[0], cand.split(" ")[0]));
    if (d <= 2 && (!best || d < best.distance)) best = { term: cand, distance: d };
  }
  return best ? best.term : null;
}

export async function categoryResultsAll(categorySlug: string): Promise<SearchResult[]> {
  const results = productsByCategory(categorySlug);
  const { listings, profiles } = await getMarketplaceState();
  return mergeListingsIntoResults(results, listings.filter((l) => l.category === categorySlug), profiles);
}

export interface DirectoryVendor {
  slug: string;
  name: string;
  verified: boolean;
  logoHue: number;
  listingCount: number;
  source: "official" | "marketplace";
  plan?: VendorProfile["plan"];
  featured?: boolean;
  /** Unlimited plan — shown with the ∞ Unlimited badge, sorted to the top. */
  unlimited?: boolean;
  blurb?: string;
}

export async function getDirectoryVendors(): Promise<DirectoryVendor[]> {
  const { listings, profiles } = await getMarketplaceState();
  const official: DirectoryVendor[] = officialSources.map((s) => {
    const v = getVendors().find((x) => x.name === s.name);
    const count = v ? getOffers().filter((o) => o.vendorId === v.id && o.active).length : 0;
    return {
      slug: v?.slug ?? s.id,
      name: s.name,
      verified: true,
      logoHue: v?.logoHue ?? 210,
      listingCount: count,
      source: "official",
      blurb: s.blurb,
    };
  });

  const seenPhone = new Set<string>();
  const marketplace: DirectoryVendor[] = [];

  for (const p of profiles) {
    const count = listings.filter((l) => l.vendorId === p.id || phoneKey(l.phone) === phoneKey(p.phone)).length;
    const visible = p.status === "approved" || count > 0;
    if (!visible) continue;
    seenPhone.add(phoneKey(p.phone));
    marketplace.push({
      slug: p.slug,
      name: p.businessName,
      verified: p.verified,
      logoHue: p.logoHue,
      listingCount: count,
      source: "marketplace",
      plan: p.plan,
      featured: planHasHomepageFeatured(p),
      unlimited: planHasUnlimited(p),
    });
  }

  // Listings submitted before vendor_profiles existed still get a directory card.
  const orphans = new Map<string, VendorListing[]>();
  for (const l of listings) {
    const key = phoneKey(l.phone);
    if (!key || seenPhone.has(key)) continue;
    const arr = orphans.get(key) ?? [];
    arr.push(l);
    orphans.set(key, arr);
  }
  for (const group of orphans.values()) {
    const first = group[0];
    marketplace.push({
      slug: `vlv-${first.id}`,
      name: first.businessName,
      verified: false,
      logoHue: 200,
      listingCount: group.length,
      source: "marketplace",
    });
  }

  marketplace.sort(
    (a, b) =>
      Number(!!b.unlimited) - Number(!!a.unlimited) ||
      Number(!!b.featured) - Number(!!a.featured) ||
      b.listingCount - a.listingCount ||
      a.name.localeCompare(b.name),
  );
  return [...official, ...marketplace];
}

export async function getFeaturedProVendors(): Promise<DirectoryVendor[]> {
  const all = await getDirectoryVendors();
  // Homepage strip: Unlimited shops lead, then Pro shops.
  return all
    .filter((v) => v.source === "marketplace" && (v.featured || v.unlimited))
    .sort((a, b) => Number(!!b.unlimited) - Number(!!a.unlimited) || b.listingCount - a.listingCount || a.name.localeCompare(b.name));
}

export async function getShopBySlug(slug: string): Promise<{
  kind: "official" | "marketplace";
  vendor: Vendor;
  profile?: VendorProfile;
  products: SearchResult[];
  listingCount: number;
  showStats: boolean;
} | undefined> {
  const official = getVendorBySlug(slug);
  const officialIsCatalogue = official && officialSources.some((s) => s.name === official.name);
  if (official && officialIsCatalogue) {
    const offers = getOffers().filter((o) => o.vendorId === official.id && o.active);
    const products: SearchResult[] = [];
    const seen = new Set<string>();
    for (const o of offers) {
      if (seen.has(o.productSlug)) continue;
      seen.add(o.productSlug);
      const product = getProduct(o.productSlug);
      if (!product) continue;
      const all = getOffersForProduct(product.slug);
      products.push({ product, offers: all, cheapest: all[0] });
    }
    return {
      kind: "official",
      vendor: official,
      products,
      listingCount: products.length,
      showStats: false,
    };
  }

  const { listings, profiles } = await getMarketplaceState();
  const profile = profiles.find((p) => p.slug === slug);
  const orphanListings = listings.filter((l) => `vlv-${l.id}` === slug);
  const shopListings = profile
    ? listings.filter((l) => l.vendorId === profile.id || phoneKey(l.phone) === phoneKey(profile.phone))
    : orphanListings;
  if (!profile && shopListings.length === 0) return undefined;

  const vendor = profile
    ? listingToVendor({ id: profile.id, businessName: profile.businessName, vendorId: profile.id }, profile)
    : listingToVendor(shopListings[0]);

  const results: SearchResult[] = [];
  mergeListingsIntoResults(results, shopListings, profiles);

  return {
    kind: "marketplace",
    vendor,
    profile,
    products: results,
    listingCount: shopListings.length,
    showStats: planHasStats(profile),
  };
}
