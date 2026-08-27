// Read-side data access. The product catalogue is the real Jumia Ghana
// marketplace snapshot plus official partner catalogues (CompuGhana,
// Franko Trading, Telefonika). Categories and guides stay in the seed file;
// vendor listings from the self-service flow merge on top.
import { vendors as seedVendors, categories, guides } from "@/data/seed";
import { jumiaProducts, jumiaOffers, jumiaVendor } from "@/lib/feeds/jumia";
import { compughanaProducts, compughanaOffers, compughanaVendor } from "@/lib/feeds/compughana";
import { frankoProducts, frankoOffers, frankoVendor } from "@/lib/feeds/franko";
import { telefonikaProducts, telefonikaOffers, telefonikaVendor } from "@/lib/feeds/telefonika";
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
}[] = [
  { id: "jumia", name: "Jumia Ghana", host: "jumia.com.gh", search: "jumia", blurb: "Marketplace listings with JumiaPay escrow.", productPrefix: "jm-" },
  { id: "compughana", name: "CompuGhana", host: "compughana.com", search: "compughana", blurb: "Authorised Apple, Samsung and HP reseller.", productPrefix: "cg-" },
  { id: "franko", name: "Franko Trading", host: "frankotrading.com", search: "franko", blurb: "High-street electronics chain — free Accra & Kumasi delivery.", productPrefix: "ft-" },
  { id: "telefonika", name: "Telefonika", host: "telefonika.com", search: "telefonika", blurb: "Phone specialist with stores across Ghana.", productPrefix: "tf-" },
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
    return { listings: all.filter((l) => l.status === "approved"), profiles };
  } catch {
    return { listings: [], profiles: [] };
  }
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
  featuredUntil?: string | null;
}, featured = isListingFeatured(l), unlimited = false): Product {
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
    featured,
    unlimited,
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
