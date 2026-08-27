// lib/feeds/compughana.ts — CompuGhana showcase catalogue loader.
//
// Second official price source: real products and prices from Ghana's
// authorised Apple/Samsung/HP reseller (compughana.com). Buy buttons go
// DIRECTLY to CompuGhana's own product pages — no affiliate rewrite
// (lib/data.ts only rewrites jumia.com.gh URLs).
//
// Prices are refreshed from CompuGhana's weekly price list / website; the
// snapshot lives in data/compughana-catalog.json like the Jumia one.
import raw from "@/data/compughana-catalog.json";
import type { Product, PriceOffer, Vendor } from "@/lib/types";

interface CatalogEntry {
  name: string;
  brand: string;
  category: string;
  url: string;
  image?: string;
  priceGhs: number;
  oldPriceGhs?: number;
  discountPct?: number;
}

interface CatalogDoc {
  source: string;
  fetchedAt: string;
  products: CatalogEntry[];
}

const catalog = raw as CatalogDoc;

export const compughanaFetchedAt: string = catalog.fetchedAt;

export const compughanaVendor: Vendor = {
  id: "v-compughana",
  name: "CompuGhana",
  slug: "compughana",
  verified: true,
  source: "direct",
  logoHue: 215,
};

function slugFor(url: string): string {
  const base = url.split("/").pop()!.replace(/\/$/, "");
  return `cg-${base}`;
}

// Honest spec chips from the listing title (screen, storage, RAM) — same
// approach as the Jumia feed.
function specsFor(entry: CatalogEntry): Record<string, string> {
  const specs: Record<string, string> = {};
  const screen = entry.name.match(/(\d{2}(?:\.\d)?)\s*(?:"|-?inch)/i);
  if (screen) specs.Screen = `${screen[1]}"`;
  const storage = entry.name.match(/(\d+(?:GB|TB))(?:\s*(?:ROM|SSD|HDD))?/i);
  if (storage) specs.Storage = storage[1];
  const ram = entry.name.match(/(\d+)GB\s*RAM/i);
  if (ram) specs.RAM = `${ram[1]}GB`;
  return Object.fromEntries(Object.entries(specs).slice(0, 4));
}

const CATEGORY_ICONS: Record<string, string> = {
  phones: "smartphone",
  laptops: "laptop",
};

export function compughanaProducts(): Product[] {
  return catalog.products.map((entry, i) => ({
    id: `cg-${i + 1}`,
    name: entry.name,
    slug: slugFor(entry.url),
    category: entry.category,
    brand: entry.brand,
    specs: specsFor(entry),
    gradient:
      entry.category === "laptops"
        ? "linear-gradient(135deg,#141E30 0%,#243B55 100%)"
        : "linear-gradient(135deg,#0E2A4A 0%,#1B5A7C 100%)",
    icon: CATEGORY_ICONS[entry.category] ?? "package",
    image: entry.image,
    canonicalUrl: entry.url,
    updatedAt: catalog.fetchedAt,
  }));
}

export function compughanaOffers(): PriceOffer[] {
  return catalog.products.map((entry, i) => ({
    id: `cgo-${i + 1}`,
    productSlug: slugFor(entry.url),
    vendorId: compughanaVendor.id,
    priceGhs: entry.priceGhs,
    stockCount: null,
    deliveryZone: "CompuGhana delivery",
    deliveryDaysMin: 1,
    deliveryDaysMax: 3,
    deliveryFeeGhs: 30,
    affiliateUrl: entry.url, // direct — official partner traffic, no affiliate rewrite
    lastCheckedAt: catalog.fetchedAt,
    active: true,
  }));
}

export function compughanaCatalogMeta() {
  return {
    source: catalog.source,
    fetchedAt: catalog.fetchedAt,
    productCount: catalog.products.length,
  };
}
