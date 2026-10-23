"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COMMUNITY_MARKET_CATEGORIES } from "@/lib/community-market-categories";
import type { CommunityMarketListing } from "@/lib/community-market";
import { formatGHS } from "@/lib/utils";

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.startsWith("233")) return digits;
  return digits;
}

function conditionLabel(condition: string): string {
  return ({ new: "New", used: "Used", refurbished: "Refurbished", unspecified: "Condition not stated" } as Record<string, string>)[condition] ?? "Condition not stated";
}

export function CommunityMarketBrowser({ listings }: { listings: CommunityMarketListing[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const categoryMatches = category === "all" || listing.category === category;
      const queryMatches = !q || `${listing.title} ${listing.description} ${listing.location} ${listing.sellerName}`.toLowerCase().includes(q);
      return categoryMatches && queryMatches;
    });
  }, [listings, query, category]);

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_240px]">
        <label className="block">
          <span className="sr-only">Search community listings</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, services or location…"
            className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-base text-navy-900 outline-none focus:border-gold-500 dark:border-navy-700 dark:bg-navy-900 dark:text-white">
            <option value="all">All categories</option>
            {COMMUNITY_MARKET_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-4 text-sm text-slate-soft dark:text-navy-300" aria-live="polite">{filtered.length} approved listing{filtered.length === 1 ? "" : "s"}</p>
      {filtered.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-navy-200 bg-navy-50/60 p-10 text-center dark:border-navy-700 dark:bg-navy-900/50">
          <p className="text-lg font-bold text-navy-900 dark:text-white">{listings.length ? "No matching listings" : "No listings yet"}</p>
          <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">Be the first to post something for the community.</p>
          <Link href="/community-market/new" className="mt-4 inline-flex rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400">Post a listing</Link>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((listing) => {
            const wa = whatsappNumber(listing.sellerWhatsapp);
            const message = `Hi ${listing.sellerName}, I saw ${listing.title} on FindIt Ghana Community Market. Is it still available?`;
            return (
              <article key={listing.id} className="overflow-hidden rounded-2xl border border-navy-100 bg-white dark:border-navy-800 dark:bg-navy-900">
                {listing.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.imageUrls[0]} alt={listing.title} className="aspect-[4/3] w-full bg-navy-50 object-cover dark:bg-navy-950" loading="lazy" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-navy-50 text-5xl dark:bg-navy-950" aria-hidden="true">🛍️</div>
                )}
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gold-700 dark:text-gold-500">{COMMUNITY_MARKET_CATEGORIES.find((item) => item.slug === listing.category)?.label ?? "Other"}</p>
                  <h2 className="mt-1 text-lg font-extrabold text-navy-900 dark:text-white">{listing.title}</h2>
                  <p className="mt-1 text-xl font-extrabold text-navy-900 dark:text-white">{listing.priceGhs === 0 ? "Free" : formatGHS(listing.priceGhs)}</p>
                  <p className="mt-2 text-xs text-slate-soft dark:text-navy-300">{conditionLabel(listing.condition)}{listing.location ? ` · ${listing.location}` : ""} · Seller: {listing.sellerName}</p>
                  {listing.description && <p className="mt-3 line-clamp-3 text-sm text-slate-soft dark:text-navy-300">{listing.description}</p>}
                  <a href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">Message seller on WhatsApp</a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
