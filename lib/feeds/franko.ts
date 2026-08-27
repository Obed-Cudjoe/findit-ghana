// lib/feeds/franko.ts — Franko Trading showcase catalogue loader.
//
// Official price source: real products and prices from Ghana's high-street
// electronics chain (frankotrading.com). Buy buttons go DIRECTLY to Franko
// Trading product pages — no affiliate rewrite (lib/data.ts only rewrites
// jumia.com.gh URLs).
import raw from "@/data/franko-catalog.json";
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

export const frankoFetchedAt: string = catalog.fetchedAt;

export const frankoVendor: Vendor = {
  id: "v-franko",
  name: "Franko Trading",
  slug: "franko-trading",
  verified: true,
  source: "direct",
  logoHue: 12,
};

function slugFor(url: string): string {
  const base = url.split("/").pop()!.replace(/\/$/, "");
  return `ft-${base}`;
}

function specsFor(entry: CatalogEntry): Record<string, string> {
  const specs: Record<string, string> = {};
  const screen = entry.name.match(/(\d{2}(?:\.\d)?)\s*(?:\"|-?inch)/i);
  if (screen) specs.Screen = `${screen[1]}"`;
  const storage = entry.name.match(/(\d+(?:GB|TB))(?:\s*(?:ROM|SSD|HDD))?/i);
  if (storage) specs.Storage = storage[1];
  const ram = entry.name.match(/(\d+)GB\s*(?:\+|RAM)/i);
  if (ram) specs.RAM = `${ram[1]}GB`;
  return Object.fromEntries(Object.entries(specs).slice(0, 4));
}

const CATEGORY_ICONS: Record<string, string> = {
  phones: "smartphone",
  laptops: "laptop",
};

export function frankoProducts(): Product[] {
  return catalog.products.map((entry, i) => ({
    id: `ft-${i + 1}`,
    name: entry.name,
    slug: slugFor(entry.url),
    category: entry.category,
    brand: entry.brand,
    specs: specsFor(entry),
    gradient:
      entry.category === "laptops"
        ? "linear-gradient(135deg,#3A0E0E 0%,#7C1B1B 100%)"
        : "linear-gradient(135deg,#4A0E0E 0%,#9B1B1B 100%)",
    icon: CATEGORY_ICONS[entry.category] ?? "package",
    image: entry.image,
    canonicalUrl: entry.url,
    updatedAt: catalog.fetchedAt,
  }));
}

export function frankoOffers(): PriceOffer[] {
  return catalog.products.map((entry, i) => ({
    id: `fto-${i + 1}`,
    productSlug: slugFor(entry.url),
    vendorId: frankoVendor.id,
    priceGhs: entry.priceGhs,
    stockCount: null,
    deliveryZone: "Free in Accra & Kumasi",
    deliveryDaysMin: 1,
    deliveryDaysMax: 3,
    deliveryFeeGhs: 0,
    affiliateUrl: entry.url, // direct — official partner traffic, no affiliate rewrite
    lastCheckedAt: catalog.fetchedAt,
    active: true,
  }));
}

export function frankoCatalogMeta() {
  return {
    source: catalog.source,
    fetchedAt: catalog.fetchedAt,
    productCount: catalog.products.length,
  };
}
