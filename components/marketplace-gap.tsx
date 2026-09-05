/* Marketplace-premium badge (COMP-17): answers the question every price
   shopper actually wants answered — "am I overpaying on the marketplace?"
   Pure server-side math on the same totals the vendor table shows, so it can
   never disagree with the numbers on the page. Renders only when a Jumia
   offer exists, another shop is cheaper, and the gap is material. */

import { Zap } from "lucide-react";
import type { PriceOffer, Vendor } from "@/lib/types";
import { jumiaVendor } from "@/lib/feeds/jumia";
import { formatGHS } from "@/lib/utils";

function totalOf(o: PriceOffer) {
  return o.priceGhs + (o.deliveryFeeGhs || 0);
}

export function MarketplaceGapBadge({
  offers,
  vendors,
}: {
  offers: PriceOffer[];
  vendors: Vendor[];
}) {
  if (offers.length < 2) return null;

  const cheapest = offers[0];
  const jumia = offers.find((o) => o.vendorId === jumiaVendor.id);
  if (!jumia || jumia.id === cheapest.id) return null;

  const cheapTotal = totalOf(cheapest);
  const jumiaTotal = totalOf(jumia);
  const gap = jumiaTotal - cheapTotal;
  if (gap <= 0 || cheapTotal <= 0) return null;

  const pct = Math.round((gap / cheapTotal) * 100);
  if (pct < 2) return null; // noise, not signal — keep the badge credible

  const winner = vendors.find((v) => v.id === cheapest.vendorId)?.name ?? "another shop";

  return (
    <p className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-xl bg-gold-500/10 px-3 py-2 text-xs font-semibold text-navy-900 ring-1 ring-gold-500/40 dark:bg-gold-500/10 dark:text-gold-300">
      <Zap className="h-3.5 w-3.5 shrink-0 text-gold-600 dark:text-gold-400" />
      <span>
        Same product, {formatGHS(gap)} less at {winner} — Jumia is {pct}% higher today (totals include delivery).
      </span>
    </p>
  );
}
