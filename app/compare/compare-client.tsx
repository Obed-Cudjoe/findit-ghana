"use client";

/* COMP-22: Compare up to 3 products side by side — the definitive
   comparison-site feature. Pick products via live autocomplete; every column
   uses the SAME merged offers as the product page (/api/product/[slug]), so
   the prices here can never disagree with the site. URL keeps the picks
   shareable (?p=slug&p=slug2). */

import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, GitCompareArrows, LoaderCircle, Search, X } from "lucide-react";
import { formatGHS, deliveryLabel } from "@/lib/utils";
import type { Product, PriceOffer, Vendor } from "@/lib/types";

interface Suggestion {
  slug: string;
  name: string;
  category: string;
  minPriceGhs: number | null;
  vendorName?: string;
}

interface Column {
  product: Product;
  offers: PriceOffer[];
  vendors: Vendor[];
}

const MAX_PICKS = 3;

function vendorName(vendors: Vendor[], id: string): string {
  return vendors.find((v) => v.id === id)?.name ?? "a named shop";
}

/* Tiny self-contained thumbnail (shared.tsx pulls the full catalogue into
   the browser bundle — not acceptable on a client page). */
function Thumb({ product }: { product: Product }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="aspect-square w-full rounded-lg bg-white object-contain" />;
  }
  return (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg" style={{ background: product.gradient }}>
      <span className="text-xl font-extrabold text-white/70">{product.brand.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

export default function CompareClient() {
  const searchParams = useSearchParams();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<string, Column>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedFromUrl = useRef(false);

  const loadColumn = useCallback(async (slug: string) => {
    if (columns[slug] || loading[slug]) return;
    setLoading((l) => ({ ...l, [slug]: true }));
    try {
      const res = await fetch(`/api/product/${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setColumns((c) => ({ ...c, [slug]: { product: data.product, offers: data.offers ?? [], vendors: data.vendors ?? [] } }));
      } else {
        setSlugs((s) => s.filter((x) => x !== slug));
      }
    } finally {
      setLoading((l) => ({ ...l, [slug]: false }));
    }
  }, [columns, loading]);

  // First load: read ?p= slugs from the URL
  useEffect(() => {
    if (loadedFromUrl.current) return;
    loadedFromUrl.current = true;
    const fromUrl = searchParams.getAll("p").filter(Boolean).slice(0, MAX_PICKS);
    if (fromUrl.length) setSlugs(fromUrl);
  }, [searchParams]);

  // Fetch data for each picked slug
  useEffect(() => {
    for (const s of slugs) loadColumn(s);
  }, [slugs, loadColumn]);

  // Keep the URL shareable
  useEffect(() => {
    const params = new URLSearchParams();
    slugs.forEach((s) => params.append("p", s));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/compare?${qs}` : "/compare");
  }, [slugs]);

  // Autocomplete (debounced)
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) setSuggestions((await res.json()).suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function pick(s: Suggestion) {
    setSlugs((cur) => (cur.includes(s.slug) || cur.length >= MAX_PICKS ? cur : [...cur, s.slug]));
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function remove(slug: string) {
    setSlugs((cur) => cur.filter((s) => s !== slug));
    setColumns((c) => {
      const next = { ...c };
      delete next[slug];
      return next;
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (suggestions[0]) pick(suggestions[0]);
  }

  const cols = slugs.map((s) => columns[s]).filter((c): c is Column => Boolean(c));
  const cheapest = (c: Column) => c.offers[0];
  const specKeys: string[] = [];
  for (const c of cols) for (const k of Object.keys(c.product.specs ?? {})) if (!specKeys.includes(k)) specKeys.push(k);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900 dark:text-navy-100">Compare</span>
      </nav>

      <header className="mt-4">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-navy-900 dark:text-navy-100 md:text-3xl">
          <GitCompareArrows className="h-7 w-7 text-gold-600 dark:text-gold-500" /> Compare products side by side
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-soft dark:text-navy-300">
          Pick up to 3 products — specs, real prices from all named shops, stock and delivery, one table. Share the link and it keeps your comparison.
        </p>
      </header>

      {/* Picker */}
      <div className="relative mt-6 max-w-xl">
        <form onSubmit={onSubmit}>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-soft dark:text-navy-300" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={slugs.length >= MAX_PICKS ? `Maximum ${MAX_PICKS} products — remove one to add another` : "Search a product to compare — e.g. Tecno Spark 50, iPhone 15…"}
            disabled={slugs.length >= MAX_PICKS}
            className="w-full rounded-xl border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 py-3 pl-12 pr-12 text-base text-navy-900 dark:text-navy-100 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30 disabled:opacity-60"
          />
        </form>
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-navy-100 bg-white shadow-xl dark:border-navy-700 dark:bg-navy-900">
            {suggestions.slice(0, 7).map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(s)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-navy-50 dark:hover:bg-navy-800"
                >
                  <span className="min-w-0 truncate font-semibold text-navy-900 dark:text-navy-100">{s.name}</span>
                  <span className="shrink-0 text-xs text-slate-soft dark:text-navy-300">
                    {s.minPriceGhs ? `from ${formatGHS(s.minPriceGhs)}` : s.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Picked chips */}
      {slugs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {slugs.map((slug) => {
            const col = columns[slug];
            const label = col?.product.name ?? (loading[slug] ? "Loading…" : slug.slice(0, 28) + "…");
            return (
              <span key={slug} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-bold text-white">
                <span className="max-w-[240px] truncate">{label}</span>
                <button type="button" onClick={() => remove(slug)} aria-label={`Remove ${label}`} className="rounded-full p-0.5 hover:bg-navy-700">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Table */}
      {cols.length >= 2 ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-navy-100 dark:border-navy-800">
                <th className="w-40 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Spec</th>
                {cols.map((c) => (
                  <th key={c.product.slug} className="px-4 py-3 text-left align-top">
                    <div className="flex items-start gap-2">
                      <div className="w-14 shrink-0">
                        <Thumb product={c.product} />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/product/${c.product.slug}`} className="line-clamp-2 break-words text-sm font-extrabold leading-snug text-navy-900 hover:text-gold-700 dark:text-navy-100 dark:hover:text-gold-500">
                          {c.product.name}
                        </Link>
                        <Link href={`/product/${c.product.slug}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-gold-600 dark:text-gold-500">
                          View page <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-navy-100 dark:border-navy-800">
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Best price</td>
                {cols.map((c) => {
                  const best = cheapest(c);
                  return (
                    <td key={c.product.slug} className="px-4 py-3">
                      {best ? (
                        <>
                          <p className="text-lg font-extrabold text-navy-900 dark:text-white">{formatGHS(best.priceGhs + best.deliveryFeeGhs)}</p>
                          <p className="text-[11px] text-slate-soft dark:text-navy-300">at {vendorName(c.vendors, best.vendorId)}</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-soft dark:text-navy-300">No live offers</p>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-navy-100 dark:border-navy-800">
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Shops comparing</td>
                {cols.map((c) => (
                  <td key={c.product.slug} className="px-4 py-3 text-sm font-semibold text-navy-900 dark:text-navy-100">
                    {new Set(c.offers.map((o) => o.vendorId)).size}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-navy-100 dark:border-navy-800">
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Stock</td>
                {cols.map((c) => {
                  const best = cheapest(c);
                  return (
                    <td key={c.product.slug} className="px-4 py-3 text-sm">
                      {best?.stockCount != null && best.stockCount > 0 ? (
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">In stock · {best.stockCount}</span>
                      ) : (
                        <span className="text-amber-700 dark:text-amber-300">Check stock with vendor</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-navy-100 dark:border-navy-800">
                <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Delivery</td>
                {cols.map((c) => {
                  const best = cheapest(c);
                  return (
                    <td key={c.product.slug} className="px-4 py-3 text-sm text-navy-900 dark:text-navy-100">
                      {best ? deliveryLabel(best) : "—"}
                    </td>
                  );
                })}
              </tr>
              {specKeys.map((key) => (
                <tr key={key} className="border-b border-navy-100 last:border-0 dark:border-navy-800">
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">{key}</td>
                  {cols.map((c) => (
                    <td key={c.product.slug} className="px-4 py-3 text-sm text-navy-900 dark:text-navy-100">
                      {c.product.specs?.[key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-10 text-center">
          {slugs.length > 0 ? (
            <p className="flex items-center justify-center gap-2 text-sm text-slate-soft dark:text-navy-300">
              <LoaderCircle className="h-4 w-4 animate-spin" /> Loading comparison…
            </p>
          ) : (
            <p className="text-sm text-slate-soft dark:text-navy-300">
              Pick at least 2 products above — the table appears here. Tip: start with a phone you know, then add its rivals.
            </p>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-soft dark:text-navy-300">
        Prices are indicative and checked regularly. Delivery fees are included in totals shown.
      </p>
    </div>
  );
}
