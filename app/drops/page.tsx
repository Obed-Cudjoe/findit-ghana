import type { Metadata } from "next";
import Link from "next/link";
import { Flame, ArrowRight, Info } from "lucide-react";
import { topDrops, type DropPick } from "@/lib/drops";
import { getCategories } from "@/lib/data";
import { formatGHS } from "@/lib/utils";
import { ProductVisual } from "@/components/shared";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Biggest Price Cuts in Ghana This Week — FindIt Ghana",
  description:
    "The deepest was-now price cuts across Ghana's named electronics shops right now, ranked by discount percentage — phones, laptops, TVs and appliances.",
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ cat?: string }>;
}

function DropCard({ pick, rank }: { pick: DropPick; rank: number }) {
  return (
    <Link
      href={`/product/${pick.slug}`}
      className="hover-lift group flex items-center gap-3 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-3"
    >
      <div className="w-16 shrink-0 sm:w-20">
        <ProductVisual
          product={
            {
              slug: pick.slug,
              name: pick.name,
              category: pick.category,
              gradient: "linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)",
              icon: "package",
              ...(pick.image ? { image: pick.image } : {}),
            } as Product
          }
          className="aspect-square w-full rounded-lg"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <Flame className="h-3.5 w-3.5" /> #{rank} cut · −{pick.pct}%
        </p>
        <h3 className="mt-0.5 line-clamp-2 break-words text-sm font-bold leading-snug text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">
          {pick.name}
        </h3>
        <p className="mt-1 text-[11px] text-slate-soft dark:text-navy-300">
          {pick.brand} · at {pick.shopName}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-slate-soft dark:text-navy-300 line-through">{formatGHS(pick.was)}</p>
        <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">{formatGHS(pick.now)}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-soft dark:text-navy-300">
          save {formatGHS(pick.was - pick.now)}
        </p>
      </div>
    </Link>
  );
}

export default async function DropsPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const categories = getCategories();
  const active = categories.some((c) => c.slug === cat) ? cat : undefined;
  const drops = topDrops(active, 24);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900 dark:text-navy-100">Price cuts</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-navy-100 md:text-3xl">
          🔥 Biggest price cuts in Ghana right now
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-soft dark:text-navy-300">
          The deepest <em>was → now</em> price cuts, as declared by the shops themselves — the same discount they show on their own product pages, ranked for you.
        </p>
      </header>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/60 dark:bg-navy-900/50 p-4 text-xs text-slate-soft dark:text-navy-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600 dark:text-gold-500" />
        <p>
          Honesty rule: a &quot;was&quot; price is each shop&apos;s own comparison price — some are genuine cuts, some are evergreen marketing. We show the shop&apos;s declared numbers, never an invented one. Check the last-checked timestamp on the product page for freshness.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/drops"
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            !active
              ? "bg-navy-900 text-white"
              : "border border-navy-200 text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-900"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/drops?cat=${c.slug}`}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
              active === c.slug
                ? "bg-navy-900 text-white"
                : "border border-navy-200 text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-900"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <section className="mt-6">
        {drops.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
            No declared cuts in this category yet — check back after the next refresh.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {drops.map((pick, i) => (
              <DropCard key={pick.slug} pick={pick as never} rank={i + 1} />
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
