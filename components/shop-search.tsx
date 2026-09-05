"use client";

/* Shop-scoped search (COMP-16): filters one vendor's own listings client-side.
   Self-contained on purpose — this file must never import from lib/data or
   components/shared (both pull in server-only modules), so it carries its own
   compact card markup that mirrors ProductCard. */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, X, Smartphone, Laptop, Tv, Refrigerator, Flame,
  WashingMachine, Gamepad, Watch, Headphones, Speaker, Shirt,
  Package, Truck, ArrowRight, PackageSearch,
} from "lucide-react";
import type { Product, PriceOffer } from "@/lib/types";
import { formatGHS, deliveryLabel } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  smartphone: Smartphone, laptop: Laptop, tv: Tv, refrigerator: Refrigerator,
  flame: Flame, "washing-machine": WashingMachine, gamepad: Gamepad, watch: Watch,
  headphones: Headphones, speaker: Speaker, shirt: Shirt, package: Package,
};

export interface ShopItem {
  product: Product;
  cheapest?: PriceOffer;
}

/* Compact card that mirrors ProductCard — but self-contained, so it can
   render inside this client component without server-only imports. */
function ShopCard({ product, cheapest }: ShopItem) {
  const Icon = ICONS[product.icon] ?? Package;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="hover-lift group flex min-w-0 flex-col overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900"
    >
      {/* Gradient tile + icon, same as ProductVisual */}
      <div
        className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden"
        style={{ background: product.gradient }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full bg-white object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" role="img" aria-label={product.name}>
            <Icon className="h-2/5 w-2/5 text-white/85" strokeWidth={1.4} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-soft dark:text-navy-300">
          <span className="truncate">
            {product.isVendorListing ? "New vendor · self-listed" : product.brand}
          </span>
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words text-sm font-bold leading-snug text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">
          {product.name}
        </h3>
        {cheapest ? (
          <>
            <p className="mt-1.5 text-lg font-extrabold text-navy-900 dark:text-white lg:text-xl">
              {formatGHS(cheapest.priceGhs)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-soft dark:text-navy-300">
              {cheapest.stockCount !== null && cheapest.stockCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> In stock · {cheapest.stockCount}
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">Check stock with vendor</span>
              )}
            </p>
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-slate-soft dark:text-navy-300">
              <Truck className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{deliveryLabel(cheapest)}</span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">No live offers yet</p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-600 dark:text-gold-500 group-hover:gap-2 transition-all lg:text-sm">
          View prices <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default function ShopSearch({
  products,
  vendorName,
}: {
  products: ShopItem[];
  vendorName: string;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return products;
    return products.filter(
      ({ product }) =>
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q),
    );
  }, [q, products]);

  return (
    <div className="mt-4">
      {/* Search box — 16px font keeps iOS from zooming on focus */}
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-soft dark:text-navy-300"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${vendorName}'s listings — e.g. iPhone, Tecno, Samsung…`}
          aria-label={`Search ${vendorName}'s listings`}
          className="w-full rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 py-3 pl-12 pr-12 text-base text-navy-900 dark:text-navy-100 placeholder:text-slate-soft dark:placeholder:text-navy-400 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-soft dark:text-navy-300 transition hover:bg-navy-50 dark:hover:bg-navy-800 hover:text-navy-900 dark:hover:text-navy-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Live count */}
      <p aria-live="polite" className="mt-2 text-xs font-semibold text-slate-soft dark:text-navy-300">
        {q
          ? `${filtered.length} of ${products.length} listing${products.length === 1 ? "" : "s"} match “${query.trim()}”`
          : `${products.length} listing${products.length === 1 ? "" : "s"} in this shop`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-slate-soft dark:text-navy-300" />
          <p className="mt-2 text-sm font-semibold text-navy-900 dark:text-navy-100">
            Nothing in this shop matches “{query.trim()}”
          </p>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">
            Try a shorter word, a brand (Tecno, Samsung…), or clear the search to see everything.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => (
            <ShopCard key={item.product.id} product={item.product} cheapest={item.cheapest} />
          ))}
        </div>
      )}
    </div>
  );
}
