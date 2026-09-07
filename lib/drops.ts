/* COMP-21: "Biggest price cuts right now" — computed from each shop's own
   declared was/now prices (oldPriceGhs vs priceGhs), which is the same data
   the shop shows on its own product page. One entry per product cluster
   (canonicalSlug dedupe) so the same phone listed by 4 shops appears once,
   with its single deepest cut and the shop offering it. */

import { getProducts, getOffersForProduct, getVendor, canonicalSlug } from "@/lib/data";
import type { Product } from "@/lib/types";

export interface DropPick {
  slug: string;
  name: string;
  category: string;
  brand: string;
  image?: string;
  was: number;
  now: number;
  pct: number;
  shopName: string;
}

export function topDrops(category?: string, limit = 24): DropPick[] {
  const byCluster = new Map<
    string,
    { product: Product; was: number; now: number; pct: number }
  >();

  for (const p of getProducts()) {
    if (!p.discountPct || !p.oldPriceGhs) continue;
    if (p.oldPriceGhs <= 0) continue;
    if (category && p.category !== category) continue;

    const canon = canonicalSlug(p.slug);
    const existing = byCluster.get(canon);
    if (!existing || p.discountPct > existing.pct) {
      // "now" price = cheapest live offer total for this shop's listing
      const offer = getOffersForProduct(p.slug)[0];
      const now = offer ? offer.priceGhs + offer.deliveryFeeGhs : 0;
      // Sanity floor: sub-GH₵100 rows are accessories/placeholders — they'd
      // otherwise top the leaderboard with meaningless "cuts".
      if (now < 100) continue;
      byCluster.set(canon, { product: p, was: p.oldPriceGhs, now, pct: p.discountPct });
    }
  }

  const picks: DropPick[] = [];
  for (const { product, was, now, pct } of byCluster.values()) {
    const offer = getOffersForProduct(product.slug)[0];
    const shopName = offer ? (getVendor(offer.vendorId)?.name ?? "a named shop") : "a named shop";
    picks.push({
      slug: product.slug,
      name: product.name,
      category: product.category,
      brand: product.brand,
      ...(product.image ? { image: product.image } : {}),
      was,
      now,
      pct,
      shopName,
    });
  }

  return picks.sort((a, b) => b.pct - a.pct || b.was - b.now - (a.was - a.now)).slice(0, limit);
}
