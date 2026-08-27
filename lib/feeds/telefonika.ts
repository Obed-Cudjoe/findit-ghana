// lib/feeds/telefonika.ts — Telefonika Ghana showcase catalogue loader.
//
// Official price source: real products and prices from Ghana's specialist
// phone retailer (telefonika.com). Buy buttons go DIRECTLY to Telefonika
// product pages — no affiliate rewrite (lib/data.ts only rewrites
// jumia.com.gh URLs).
import raw from "@/data/telefonika-catalog.json";
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

export const telefonikaFetchedAt: string = catalog.fetchedAt;

export const telefonikaVendor: Vendor = {
  id: "v-telefonika",
  name: "Telefonika",
  slug: "telefonika",
  verified: true,
  source: "direct",
  logoHue: 265,
};

function slugFor(url: string): string {
  const base = url.split("/").pop()!.replace(/\/$/, "");
  return `tf-${base}`;
}

function specsFor(entry: CatalogEntry): Record<string, string> {
  const specs: Record<string, string> = {};
  const screen = entry.name.match(/(\d{2}(?:\.\d)?)\s*(?:\"|-?inch)/i);
  if (screen) specs.Screen = `${screen[1]}"`;
  const storage = entry.name.match(/(\d+(?:GB|TB))(?:\s*(?:ROM|SSD|HDD))?/i);
  if (storage) specs.Storage = storage[1];
  const ram = entry.name.match(/(\d+)GB(?:\s*RAM|\s*\/)/i);
  if (ram) specs.RAM = `${ram[1]}GB`;
  return Object.fromEntries(Object.entries(specs).slice(0, 4));
}

const CATEGORY_ICONS: Record<string, string> = {
  phones: "smartphone",
  laptops: "laptop",
};

export function telefonikaProducts(): Product[] {
  return catalog.products.map((entry, i) => ({
    id: `tf-${i + 1}`,
    name: entry.name,
    slug: slugFor(entry.url),
    category: entry.category,
    brand: entry.brand,
    specs: specsFor(entry),
    gradient:
      entry.category === "laptops"
        ? "linear-gradient(135deg,#1B0E4A 0%,#3A1B7C 100%)"
        : "linear-gradient(135deg,#2A0E4A 0%,#5A1B8C 100%)",
    icon: CATEGORY_ICONS[entry.category] ?? "package",
    image: entry.image,
    canonicalUrl: entry.url,
    updatedAt: catalog.fetchedAt,
  }));
}

export function telefonikaOffers(): PriceOffer[] {
  return catalog.products.map((entry, i) => ({
    id: `tfo-${i + 1}`,
    productSlug: slugFor(entry.url),
    vendorId: telefonikaVendor.id,
    priceGhs: entry.priceGhs,
    stockCount: null,
    deliveryZone: "Free delivery in Accra",
    deliveryDaysMin: 1,
    deliveryDaysMax: 3,
    deliveryFeeGhs: 0,
    affiliateUrl: entry.url, // direct — official partner traffic, no affiliate rewrite
    lastCheckedAt: catalog.fetchedAt,
    active: true,
  }));
}

export function telefonikaCatalogMeta() {
  return {
    source: catalog.source,
    fetchedAt: catalog.fetchedAt,
    productCount: catalog.products.length,
  };
}
