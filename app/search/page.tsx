import type { Metadata } from "next";
import Link from "next/link";
import { Clock, X } from "lucide-react";
import { searchWithOptions, getBrandOptions, getZoneOptions, didYouMean } from "@/lib/data";
import { ProductCard, EmptyState } from "@/components/shared";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SearchFilterPanel, type FilterState } from "@/components/search-filters";

export const metadata: Metadata = {
  title: "Search prices in Ghana",
  description: "Search live prices in cedis across named vendors in Ghana — stock levels and delivery costs included.",
};

export const revalidate = 300;

interface Props {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    min?: string;
    max?: string;
    instock?: string;
    verified?: string;
    zone?: string;
    sort?: string;
  }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q ?? "";

  const options = {
    brand: sp.brand ?? "",
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    inStockOnly: sp.instock === "1",
    verifiedOnly: sp.verified === "1",
    zone: sp.zone ?? "",
    sort: (sp.sort === "price-asc" || sp.sort === "price-desc" || sp.sort === "newest" ? sp.sort : "relevance"),
  } satisfies { brand: string; minPrice?: number; maxPrice?: number; inStockOnly: boolean; verifiedOnly: boolean; zone: string; sort: "relevance" | "price-asc" | "price-desc" | "newest" };

  const results = await searchWithOptions(q, options);
  const brands = getBrandOptions();
  const zones = getZoneOptions();
  const suggestion = q && results.length === 0 ? didYouMean(q) : null;
  const checkedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

  const filterState: FilterState = {
    brand: options.brand,
    min: sp.min ?? "",
    max: sp.max ?? "",
    instock: options.inStockOnly ? "1" : "",
    verified: options.verifiedOnly ? "1" : "",
    zone: options.zone,
    sort: options.sort ?? "relevance",
  };

  // chips for active filters (clearable via link)
  const activeChips: { label: string; href: string }[] = [];
  const makeHref = (remove: string[]) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const map: Record<string, string | undefined> = {
      brand: options.brand || undefined,
      min: sp.min || undefined,
      max: sp.max || undefined,
      instock: options.inStockOnly ? "1" : undefined,
      verified: options.verifiedOnly ? "1" : undefined,
      zone: options.zone || undefined,
      sort: options.sort && options.sort !== "relevance" ? options.sort : undefined,
    };
    for (const k of Object.keys(map)) {
      if (!remove.includes(k) && map[k]) p.set(k, map[k] as string);
    }
    return `/search?${p.toString()}`;
  };
  if (options.brand) activeChips.push({ label: `Brand: ${options.brand}`, href: makeHref(["brand"]) });
  if (options.minPrice !== undefined) activeChips.push({ label: `Min GH₵${options.minPrice}`, href: makeHref(["min"]) });
  if (options.maxPrice !== undefined) activeChips.push({ label: `Max GH₵${options.maxPrice}`, href: makeHref(["max"]) });
  if (options.inStockOnly) activeChips.push({ label: "In stock", href: makeHref(["instock"]) });
  if (options.verifiedOnly) activeChips.push({ label: "Verified only", href: makeHref(["verified"]) });
  if (options.zone) activeChips.push({ label: `Zone: ${options.zone}`, href: makeHref(["zone"]) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft">
        <a href="/" className="hover:text-navy-700">Home</a> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900">Search</span>
      </nav>

      <div className="mt-4">
        <h1 className="break-words text-2xl font-extrabold text-navy-900">
          {q ? `Results for “${q}”` : "Search prices in Ghana"}
        </h1>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-soft">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
          {results.length > 0
            ? `${results.length} result${results.length === 1 ? "" : "s"} · prices checked ${checkedAt} UTC`
            : "Try a product name, brand or category"}
        </p>
      </div>

      {/* refine search with autocomplete */}
      <div className="mt-4 max-w-xl">
        <SearchAutocomplete variant="compact" initialQuery={q} />
      </div>

      {/* active filter chips */}
      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-soft">Active:</span>
          {activeChips.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white hover:bg-navy-800 transition-colors"
            >
              {c.label} <X className="h-3 w-3" />
            </Link>
          ))}
        </div>
      )}

      {/* results + filters */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <SearchFilterPanel q={q} brands={brands} zones={zones} current={filterState} />

        <div>
          {results.length === 0 ? (
            <>
              <EmptyState
                title={q ? `No matches for “${q}”` : "Search for any product"}
                hint={q ? "Check the spelling, or browse a category below." : "Type a product name — phones, laptops, appliances and more."}
              />
              {suggestion && (
                <div className="mt-4 rounded-xl border border-gold-500/40 bg-gold-500/10 px-5 py-4 text-sm">
                  <span className="text-slate-soft">Did you mean{" "}</span>
                  <Link
                    href={`/search?q=${encodeURIComponent(suggestion)}`}
                    className="font-bold text-gold-700 underline hover:text-gold-800"
                  >
                    {suggestion}
                  </Link>
                  <span className="text-slate-400"> ?</span>
                </div>
              )}
              {options.inStockOnly && (
                <div className="mt-4 rounded-xl border border-navy-100 bg-navy-50/60 px-5 py-4 text-sm text-slate-soft">
                  Catalogue shops (Jumia, CompuGhana, Franko, Telefonika) don&apos;t publish live stock counts —
                  only marketplace vendors with the &quot;In stock&quot; badge do. Try removing the stock filter to see
                  everything, or check stock on the product page before buying.
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map(({ product, cheapest }) => (
                <ProductCard key={product.id} product={product} cheapest={cheapest} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <p className="mt-8 text-center text-xs text-slate-soft">
              Prices are indicative and re-checked daily. Total shown is the best offer&apos;s item price — delivery fees
              appear on each product page. Confirm the final price with the vendor before paying.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
