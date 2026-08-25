// Shared building blocks used across pages. Every component is styled with
// the brand tokens (navy/gold) defined in app/globals.css.

import Link from "next/link";
import {
  Smartphone, Laptop, Tv, Refrigerator, Flame, WashingMachine, Gamepad,
  Watch, Headphones, Speaker, Shirt, Package, ShieldCheck, Clock, Truck,
  ArrowRight, Star,
} from "lucide-react";
import type { Product, PriceOffer, Vendor } from "@/lib/types";
import { formatGHS, deliveryLabel, timeAgo } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  smartphone: Smartphone, laptop: Laptop, tv: Tv, refrigerator: Refrigerator,
  flame: Flame, "washing-machine": WashingMachine, gamepad: Gamepad, watch: Watch,
  headphones: Headphones, speaker: Speaker, shirt: Shirt, package: Package,
};

/* ---------- Product visual: gradient tile + icon. Never depends on an
   external image, so it renders identically everywhere. ---------- */
export function ProductVisual({ product, className = "" }: { product: Product; className?: string }) {
  const Icon = ICONS[product.icon] ?? Package;
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ background: product.gradient }}
      role="img"
      aria-label={product.name}
    >
      <Icon className="h-2/5 w-2/5 text-white/85" strokeWidth={1.4} />
    </div>
  );
}

/* ---------- Product card (COMP-07): results, category, similar products ---------- */
export function ProductCard({ product, cheapest }: { product: Product; cheapest?: PriceOffer }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="hover-lift group flex min-w-0 flex-col overflow-hidden rounded-xl border border-navy-100 bg-white"
    >
      <ProductVisual product={product} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-soft">
          {product.isVendorListing ? "New vendor · self-listed" : product.brand}
        </p>
        <h3 className="mt-0.5 break-words font-bold text-navy-900 group-hover:text-navy-600 transition-colors">{product.name}</h3>
        {cheapest ? (
          <>
            <p className="mt-2 text-xl font-extrabold text-navy-900">{formatGHS(cheapest.priceGhs)}</p>
            <p className="mt-1 text-xs text-slate-soft">
              {cheapest.stockCount !== null && cheapest.stockCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> In stock · {cheapest.stockCount}
                </span>
              ) : (
                <span className="text-amber-700">Check stock with vendor</span>
              )}
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-soft">
              <Truck className="h-3.5 w-3.5" /> {deliveryLabel(cheapest)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-soft">No live offers yet</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-600 group-hover:gap-2 transition-all">
          View prices <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

/* ---------- Price history sparkline (COMP-09) — inline SVG, no chart lib ---------- */
export function PriceChart({ points }: { points: { priceGhs: number; capturedAt: string }[] }) {
  if (points.length < 2) return null;
  const w = 320, h = 80, pad = 6;
  const min = Math.min(...points.map((p) => p.priceGhs));
  const max = Math.max(...points.map((p) => p.priceGhs));
  const span = max - min || 1;
  const coords = points.map((p, i) => ({
    x: pad + (i * (w - 2 * pad)) / (points.length - 1),
    y: h - pad - ((p.priceGhs - min) / span) * (h - 2 * pad),
  }));
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${pad},${h - pad} ${line} ${w - pad},${h - pad}`;
  const last = coords[coords.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" role="img" aria-label="Price history chart">
        <polygon points={area} fill="#F2B705" opacity="0.15" />
        <polyline points={line} fill="none" stroke="#F2B705" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="4" fill="#0F2A43" stroke="#F2B705" strokeWidth="2" />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-slate-soft">
        <span>{new Date(points[0].capturedAt).toLocaleDateString("en-GB", { month: "short" })}</span>
        <span>12-week history</span>
        <span>{new Date(points[points.length - 1].capturedAt).toLocaleDateString("en-GB", { month: "short" })}</span>
      </div>
    </div>
  );
}

/* ---------- Trust strip (COMP-06) ---------- */
export function TrustStrip() {
  return (
    <div className="border-y border-navy-100 bg-navy-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3 text-sm text-navy-800">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Named vendors</span>
        <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gold-600" /> Prices checked daily</span>
        <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-navy-500" /> Delivery shown upfront</span>
      </div>
    </div>
  );
}

/* ---------- Empty state (COMP-15) — never a dead end ---------- */
export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/60 p-10 text-center">
      <p className="font-bold text-navy-900">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-soft">{hint}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
        {["iphone 13", "gas cooker", "ps5", "airpods"].map((s) => (
          <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-navy-200 bg-white px-3 py-1 text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors">
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- Star rating row (decorative, seller-side trust) ---------- */
export function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} star rating`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? "fill-gold-500 text-gold-500" : "text-navy-200"}`} />
      ))}
    </span>
  );
}
