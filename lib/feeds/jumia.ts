// lib/feeds/jumia.ts — real Jumia Ghana catalogue loader.
//
// Loads the committed snapshot (data/jumia-catalog.json) of real products and
// live GH₵ prices scraped from jumia.com.gh, and maps every entry onto the
// site's Product + PriceOffer contract (lib/types.ts) so the whole app —
// search, categories, product pages, sitemap, admin — reads real marketplace
// data through the exact same interface the demo seed used.
//
// Every outbound offer URL is a jumia.com.gh product page, so lib/data.ts
// rewrites it to the owner's Jumia affiliate link automatically.
//
// To refresh prices: run `node scripts/fetch-jumia.mjs` from a network-enabled
// machine — it rewrites the JSON snapshot; commit the result.
import raw from "@/data/jumia-catalog.json";
import type { Product, PriceOffer, Vendor } from "@/lib/types";

interface CatalogEntry {
  name: string;
  brand: string;
  category: string;
  url: string;
  priceGhs: number;
  oldPriceGhs?: number;
  discountPct?: number;
  rating?: number;
  reviews?: number;
}

interface CatalogDoc {
  source: string;
  description: string;
  fetchedAt: string;
  currency: string;
  deliveryModel: string;
  products: CatalogEntry[];
}

const catalog = raw as CatalogDoc;

// The catalogue snapshot's freshness. Every product/offer carries this date —
// it powers the "prices checked X ago" stamp, so it must be the scrape date.
export const jumiaFetchedAt: string = catalog.fetchedAt;

// Deterministic URL → slug: the Jumia URL basename (unique per listing) minus
// the .html suffix, truncated in the middle if needed but always keeping the
// trailing numeric listing id so slugs stay unique and stable.
function slugFor(url: string): string {
  const base = url.split("/").pop()!.replace(/\.html$/i, "");
  if (base.length <= 90) return base;
  return `${base.slice(0, 78)}-${base.slice(-9)}`;
}

// Extract a few honest spec chips from the listing title itself (screen size,
// storage, RAM, capacity). Only what the marketplace title actually states —
// no invented specs. Customer rating (also scraped) fills the fourth chip.
function specsFor(entry: CatalogEntry): Record<string, string> {
  const specs: Record<string, string> = {};
  const screen = entry.name.match(/(\d{2}(?:\.\d)?)\s*(?:"|''|”|-?inch)/i);
  if (screen) specs.Screen = `${screen[1]}"`;
  // Storage: either an explicitly labelled ROM/HDD/SSD figure, or a bare GB
  // figure big enough that it can't be RAM (skips "6GB RAM + 256GB SSD", "1GB+8GB").
  const labelled = entry.name.match(/(\d+)\s*GB\s*(?:ROM|HDD|SSD)\b/i);
  const bare = entry.name.match(/(\d{2,})\s*GB(?!\s*(?:RAM|LPDDR))/i);
  const storage = labelled?.[1] ?? (Number(bare?.[1]) >= 16 ? bare?.[1] : undefined);
  if (storage) specs.Storage = `${storage}GB`;
  const ram = entry.name.match(/(\d+(?:\.\d+)?)\s*GB\s*(?:RAM|LPDDR)/i);
  if (ram) specs.RAM = `${ram[1]}GB`;
  const capacity = entry.name.match(/(\d+(?:\.\d+)?)\s*(?:L\b|Liters?|Litres?|kg)/i);
  if (capacity) specs.Capacity = `${capacity[1]}${entry.name.match(/kg/i) ? "kg" : "L"}`;
  if (entry.rating) specs.Rating = `${entry.rating}/5${entry.reviews ? ` (${entry.reviews})` : ""}`;
  return Object.fromEntries(Object.entries(specs).slice(0, 4));
}

// Tile icon — a keyword pass first (fridges vs washers, TVs vs speakers,
// games vs consoles), then the category default.
const CATEGORY_ICONS: Record<string, string> = {
  phones: "smartphone",
  laptops: "laptop",
  "tv-audio": "tv",
  appliances: "refrigerator",
  gaming: "gamepad",
  fashion: "watch",
};

function iconFor(entry: CatalogEntry): string {
  const n = entry.name.toLowerCase();
  if (/watch/.test(n)) return "watch";
  if (/washing|washer/.test(n)) return "washing-machine";
  if (/fridge|refrigerator|freezer/.test(n)) return "refrigerator";
  if (/tv\b|television/.test(n)) return "tv";
  if (/speaker|woofer|amplifier|soundbar|headset|headphone/.test(n)) return "speaker";
  if (/laptop|notebook|elitebook|probook|macbook/.test(n)) return "laptop";
  if (/controller|gamepad|console|game\b/.test(n)) return "gamepad";
  if (/phone|camon|spark|pop\s|hot\s|smart\s?20/.test(n)) return "smartphone";
  return CATEGORY_ICONS[entry.category] ?? "package";
}

// Tile gradient — three tonal variants per category (matching the category
// page palette), picked deterministically from a slug hash so grids don't
// look uniform but every render is identical.
const CATEGORY_GRADIENTS: Record<string, string[]> = {
  phones: [
    "linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)",
    "linear-gradient(135deg,#0E3A3A 0%,#1B7C7C 100%)",
    "linear-gradient(135deg,#0E2A4A 0%,#1B5A7C 100%)",
  ],
  laptops: [
    "linear-gradient(135deg,#141E30 0%,#243B55 100%)",
    "linear-gradient(135deg,#0E4A40 0%,#127C6B 100%)",
    "linear-gradient(135deg,#2A0E4A 0%,#4A1B7C 100%)",
  ],
  "tv-audio": [
    "linear-gradient(135deg,#4A2A0E 0%,#7C4A12 100%)",
    "linear-gradient(135deg,#0E2A1B 0%,#1B5A3A 100%)",
    "linear-gradient(135deg,#3A0E0E 0%,#7C1B1B 100%)",
  ],
  appliances: [
    "linear-gradient(135deg,#3A0E4A 0%,#6B1B7C 100%)",
    "linear-gradient(135deg,#1B2A3A 0%,#3A4A5A 100%)",
    "linear-gradient(135deg,#0E3A2A 0%,#1B7C5A 100%)",
  ],
  gaming: [
    "linear-gradient(135deg,#1B0E4A 0%,#3A1B7C 100%)",
    "linear-gradient(135deg,#0F0F2A 0%,#1F1F5A 100%)",
    "linear-gradient(135deg,#0E3A0E 0%,#1B7C1B 100%)",
  ],
  fashion: [
    "linear-gradient(135deg,#4A0E2A 0%,#7C1B4A 100%)",
    "linear-gradient(135deg,#2A0E2A 0%,#5A1B5A 100%)",
    "linear-gradient(135deg,#3A1B0E 0%,#7C3A1B 100%)",
  ],
};

function gradientFor(slug: string, category: string): string {
  const palette = CATEGORY_GRADIENTS[category] ?? ["linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

// Jumia Ghana as the marketplace vendor behind every offer. Verified: it is a
// named, escrow-backed marketplace (JumiaPay) — exactly what the trust bar
// promises shoppers.
export const jumiaVendor: Vendor = {
  id: "v-jumia",
  name: "Jumia Ghana",
  slug: "jumia-ghana",
  verified: true,
  source: "jumia",
  logoHue: 28, // marketplace orange
};

export function jumiaProducts(): Product[] {
  return catalog.products.map((entry, i) => {
    const slug = slugFor(entry.url);
    return {
      id: `jm-${i + 1}`,
      name: entry.name,
      slug,
      category: entry.category,
      brand: entry.brand,
      specs: specsFor(entry),
      gradient: gradientFor(slug, entry.category),
      icon: iconFor(entry),
      canonicalUrl: entry.url,
      updatedAt: catalog.fetchedAt,
    };
  });
}

// One live offer per product, straight from the marketplace listing.
// Delivery: Jumia shows the final fee per delivery address at checkout and a
// large share of marketplace items ship free, so the offer models
// "Jumia delivery · 2–5 days" at no added fee (see the snapshot's
// deliveryModel note). Sort order by total cost is unaffected with one offer.
export function jumiaOffers(): PriceOffer[] {
  return catalog.products.map((entry, i) => ({
    id: `jmo-${i + 1}`,
    productSlug: slugFor(entry.url),
    vendorId: jumiaVendor.id,
    priceGhs: entry.priceGhs,
    stockCount: null, // marketplace stock varies by seller; Jumia confirms at checkout
    deliveryZone: "Jumia delivery",
    deliveryDaysMin: 2,
    deliveryDaysMax: 5,
    deliveryFeeGhs: 0,
    affiliateUrl: entry.url,
    lastCheckedAt: catalog.fetchedAt,
    active: true,
  }));
}

export function jumiaCatalogMeta() {
  return {
    source: catalog.source,
    fetchedAt: catalog.fetchedAt,
    currency: catalog.currency,
    productCount: catalog.products.length,
  };
}
