import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { searchAll, getVendors } from "@/lib/data";
import { ProductCard, EmptyState } from "@/components/shared";

export const metadata: Metadata = {
  title: "Search prices in Ghana",
  description: "Search live prices in cedis across named vendors in Ghana — stock levels and delivery costs included.",
};

export const revalidate = 300;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const results = await searchAll(q);
  const vendors = getVendors();
  const checkedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft">
        <a href="/" className="hover:text-navy-700">Home</a> <span aria-hidden="true">›</span> <span className="text-navy-900">Search</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="break-words text-2xl font-extrabold text-navy-900">
            {q ? `Results for “${q}”` : "Search prices in Ghana"}
          </h1>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-soft">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
            {results.length > 0 ? `${results.length} result${results.length === 1 ? "" : "s"} · ${vendors.length} named vendors · prices checked ${checkedAt} UTC` : "Try a product name, brand or category"}
          </p>
        </div>
        <form action="/search" method="get" role="search" className="w-full sm:w-72">
          <label htmlFor="results-q" className="sr-only">Refine search</label>
          <div className="flex overflow-hidden rounded-lg border border-navy-200 bg-white focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/30">
            <input id="results-q" name="q" type="search" defaultValue={q} placeholder="Search again…" className="min-w-0 flex-1 px-3 py-2.5 text-base focus:outline-none" />
            <button type="submit" className="shrink-0 bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 transition-colors">Go</button>
          </div>
        </form>
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState
            title={q ? `No matches for “${q}”` : "Search for any product"}
            hint={q ? "Check the spelling, or browse a category below." : "Type a product name — phones, laptops, appliances and more."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map(({ product, cheapest }) => (
              <ProductCard key={product.id} product={product} cheapest={cheapest} />
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <p className="mt-8 text-center text-xs text-slate-soft">
          Prices are indicative and re-checked daily. Total shown is the best offer&apos;s item price — delivery fees appear on each product page. Confirm the final price with the vendor before paying.
        </p>
      )}
    </div>
  );
}
