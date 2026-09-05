import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Info, ArrowRight } from "lucide-react";
import { bestValue, type ValuePick } from "@/lib/value-score";
import { formatGHS } from "@/lib/utils";
import { ProductVisual } from "@/components/shared";

export const metadata: Metadata = {
  title: "Best Value Phones & Laptops in Ghana — FindIt Ghana",
  description:
    "Ghana's first specs-per-cedi ranking: the phones and laptops that give you the most hardware for your money, with a transparent scoring formula and live prices.",
};

export const revalidate = 3600;

function PickCard({ pick, rank }: { pick: ValuePick; rank: number }) {
  const { product, offer, score } = pick;
  const chips = [
    `${pick.ramGb}GB RAM`,
    `${pick.storageGb}GB storage`,
    pick.screenIn ? `${pick.screenIn}"` : null,
    pick.batteryMah ? `${pick.batteryMah}mAh` : null,
  ].filter((c): c is string => Boolean(c));

  return (
    <Link
      href={`/product/${product.slug}`}
      className="hover-lift group flex items-center gap-3 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-3"
    >
      <div className="w-16 shrink-0 sm:w-20">
        <ProductVisual product={product} className="aspect-square w-full rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gold-700 dark:text-gold-500">
          <Trophy className="h-3.5 w-3.5" /> #{rank} value pick
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words text-sm font-bold leading-snug text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-navy-50 dark:bg-navy-900/60 px-2 py-0.5 text-[10px] font-semibold text-navy-700 dark:text-navy-200">
              {c}
            </span>
          ))}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-extrabold text-navy-900 dark:text-white">{formatGHS(offer.priceGhs + offer.deliveryFeeGhs)}</p>
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
          Score {score}
        </p>
        <p className="mt-1 text-[11px] text-slate-soft dark:text-navy-300">specs per cedi</p>
      </div>
    </Link>
  );
}

export default function BestValuePage() {
  const phones = bestValue("phones", 10);
  const laptops = bestValue("laptops", 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900 dark:text-navy-100">Best value</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-navy-100 md:text-3xl">
          Best value in Ghana — the most specs per cedi
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-soft dark:text-navy-300">
          Ranking from live catalogue prices, computed with one public formula. A higher score means more hardware for your money — not a vendor&apos;s opinion.
        </p>
      </header>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/50 p-4 text-xs text-slate-soft dark:text-navy-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-500" />
        <p>
          <span className="font-semibold text-navy-800 dark:text-navy-200">How we score:</span> points = RAM&nbsp;GB × 10 + storage&nbsp;GB ÷ 16 + screen&nbsp;inches × 2 + battery&nbsp;mAh ÷ 500. Score = points ÷ total price (price + delivery, GH₵) × 1,000. Only products with both RAM and storage listed qualify, so the score is never built on missing data.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Phones</h2>
        {phones.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
            No phones with parseable specs yet — the score only shows real data.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {phones.map((p, i) => (
              <PickCard key={p.product.slug} pick={p} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Laptops</h2>
        {laptops.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
            No laptops with parseable specs yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {laptops.map((p, i) => (
              <PickCard key={p.product.slug} pick={p} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 text-center text-sm text-slate-soft dark:text-navy-300">
        Prices are indicative and checked regularly.{" "}
        <Link href="/search" className="inline-flex items-center gap-1 font-semibold text-navy-800 dark:text-navy-200 underline">
          Search all products <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </p>
    </div>
  );
}
