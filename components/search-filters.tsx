"use client";

// F02/F03 — filters + sort for the search results page.
// A GET form that preserves the query and narrows server-side
// (searchWithOptions in lib/data.ts). Desktop: sidebar panel.
// Mobile: collapsible drawer behind a "Filters" button.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterState {
  brand: string;
  min: string;
  max: string;
  instock: string; // "1" | ""
  verified: string; // "1" | ""
  zone: string;
  sort: string;
}

export function SearchFilterPanel({
  q,
  brands,
  zones,
  current,
}: {
  q: string;
  brands: string[];
  zones: string[];
  current: FilterState;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(current);

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (draft.brand) params.set("brand", draft.brand);
    if (draft.min) params.set("min", draft.min);
    if (draft.max) params.set("max", draft.max);
    if (draft.instock) params.set("instock", "1");
    if (draft.verified) params.set("verified", "1");
    if (draft.zone) params.set("zone", draft.zone);
    if (draft.sort && draft.sort !== "relevance") params.set("sort", draft.sort);
    router.push(`/search?${params.toString()}`);
    setMobileOpen(false);
  }

  function clearAll() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/search?${params.toString()}`);
    setDraft({ brand: "", min: "", max: "", instock: "", verified: "", zone: "", sort: "relevance" });
    setMobileOpen(false);
  }

  const hasActive = Boolean(
    current.brand || current.min || current.max || current.instock || current.verified || current.zone
  );

  const selectCls =
    "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";
  const inputCls =
    "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

  const panel = (
    <div className="space-y-5">
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Sort by</p>
        <select className={selectCls} value={draft.sort} onChange={(e) => setDraft({ ...draft, sort: e.target.value })}>
          <option value="relevance">Relevance</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Brand</p>
        <select className={selectCls} value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Max price (GH₵)</p>
        <div className="flex items-center gap-2">
          <input
            className={inputCls}
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={draft.min}
            onChange={(e) => setDraft({ ...draft, min: e.target.value })}
          />
          <span className="text-slate-soft dark:text-navy-300">–</span>
          <input
            className={inputCls}
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={draft.max}
            onChange={(e) => setDraft({ ...draft, max: e.target.value })}
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Delivery zone</p>
        <select className={selectCls} value={draft.zone} onChange={(e) => setDraft({ ...draft, zone: e.target.value })}>
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-900 dark:text-navy-100">
          <input
            type="checkbox"
            className="h-4 w-4 accent-gold-600"
            checked={draft.instock === "1"}
            onChange={(e) => setDraft({ ...draft, instock: e.target.checked ? "1" : "" })}
          />
          In stock only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-900 dark:text-navy-100">
          <input
            type="checkbox"
            className="h-4 w-4 accent-gold-600"
            checked={draft.verified === "1"}
            onChange={(e) => setDraft({ ...draft, verified: e.target.checked ? "1" : "" })}
          />
          Verified vendors only
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={apply}
          className="flex-1 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-navy-800 transition-colors"
        >
          Apply
        </button>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-navy-200 dark:border-navy-700 px-4 py-2.5 text-sm font-semibold text-slate-soft dark:text-navy-300 hover:border-red-300 hover:text-red-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* desktop sidebar */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5 dark:border-navy-800 dark:bg-navy-900">
          <p className="mb-4 flex items-center gap-2 font-bold text-navy-900 dark:text-navy-100">
            <SlidersHorizontal className="h-4 w-4 text-gold-600 dark:text-gold-500" /> Filters
          </p>
          {panel}
        </div>
      </div>

      {/* mobile: collapsible */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-4 py-2.5 text-sm font-bold text-navy-900 dark:text-navy-100"
        >
          <SlidersHorizontal className="h-4 w-4 text-gold-600 dark:text-gold-500" />
          {hasActive ? "Filters active" : "Filters & sort"}
        </button>
        {mobileOpen && (
          <div className="mt-3 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5 shadow-lg dark:border-navy-800 dark:bg-navy-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-navy-900 dark:text-navy-100">Filters & sort</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="rounded-lg p-1 text-slate-soft dark:text-navy-300 hover:bg-navy-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {panel}
          </div>
        )}
      </div>
    </>
  );
}
