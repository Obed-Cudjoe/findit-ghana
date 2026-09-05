/* COMP-20: Value Score — specs per cedi. A transparent, explainable ranking
   for shoppers ("best value phones in Ghana"), computed from the same
   catalogue the rest of the site serves. Formula (displayed on the page):

     points = RAM GB × 10 + storage GB ÷ 16 + screen inches × 2 + battery mAh ÷ 500
     score  = points ÷ total price (GH₵) × 1,000

   Only products with parseable RAM + storage qualify, so the score is never
   computed from empty data. */

import { getProducts, getOffersForProduct } from "@/lib/data";
import type { Product, PriceOffer } from "@/lib/types";

export interface ValuePick {
  product: Product;
  offer: PriceOffer;
  score: number;
  ramGb: number;
  storageGb: number;
  screenIn: number | null;
  batteryMah: number | null;
}

function firstNumber(value: string | undefined): number | null {
  if (!value) return null;
  const m = value.replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function pickMax(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && v > 0);
  return nums.length ? Math.max(...nums) : null;
}

function parseSpecs(product: Product): {
  ramGb: number | null;
  storageGb: number | null;
  screenIn: number | null;
  batteryMah: number | null;
} {
  const ram: (number | null)[] = [];
  const storage: (number | null)[] = [];
  const screen: (number | null)[] = [];
  const battery: (number | null)[] = [];

  for (const [key, value] of Object.entries(product.specs ?? {})) {
    const k = key.toLowerCase();
    const n = firstNumber(value);
    if (n === null) continue;
    if (k.includes("ram")) ram.push(n);
    else if (k.includes("storage") || k.includes("rom") || (k.includes("memory") && !k.includes("ram"))) storage.push(n);
    else if (k.includes("screen") || k.includes("display")) screen.push(n);
    else if (k.includes("battery")) battery.push(n);
  }

  return {
    ramGb: pickMax(ram),
    storageGb: pickMax(storage),
    screenIn: pickMax(screen),
    batteryMah: pickMax(battery),
  };
}

export function scoreProduct(product: Product): ValuePick | null {
  const s = parseSpecs(product);
  if (s.ramGb === null || s.storageGb === null) return null;
  // Hardware sanity caps: phones don't ship with 64GB+ RAM or 4TB+ storage —
  // a parsed value beyond these is a garbled source string, not real specs.
  if (s.ramGb > 64 || s.storageGb > 4096) return null;
  const offer = getOffersForProduct(product.slug)[0];
  if (!offer) return null;
  const total = offer.priceGhs + offer.deliveryFeeGhs;
  if (total <= 0) return null;
  // Sanity floor: sub-GH₵100 listings in electronics categories are usually
  // accessories or placeholder rows — they'd dominate the ranking unfairly.
  if (total < 100) return null;

  const points =
    s.ramGb * 10 +
    s.storageGb / 16 +
    (s.screenIn ?? 0) * 2 +
    (s.batteryMah ?? 0) / 500;
  const score = Math.round((points * 1000 * 10) / total) / 10;
  if (!Number.isFinite(score) || score <= 0) return null;

  return {
    product,
    offer,
    score,
    ramGb: s.ramGb,
    storageGb: s.storageGb,
    screenIn: s.screenIn,
    batteryMah: s.batteryMah,
  };
}

export function bestValue(category: string, limit: number): ValuePick[] {
  return getProducts()
    .filter((p) => p.category === category)
    .map(scoreProduct)
    .filter((v): v is ValuePick => v !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
