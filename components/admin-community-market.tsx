"use client";

import { useState } from "react";
import { COMMUNITY_MARKET_CATEGORIES } from "@/lib/community-market-categories";
import type { CommunityMarketListing, } from "@/lib/community-market";
import type { CommunityListingStatus } from "@/lib/community-market-categories";

export function AdminCommunityMarket({ initialListings }: { initialListings: CommunityMarketListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function changeStatus(id: string, status: CommunityListingStatus) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/community-market/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(typeof result.error === "string" ? result.error : "Could not update listing.");
        return;
      }
      setListings((all) => all.map((item) => item.id === id ? { ...item, status } : item));
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300" role="alert">{message}</p>}
      {listings.map((item) => (
        <article key={item.id} className="rounded-xl border border-navy-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-navy-900 dark:text-white">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">{COMMUNITY_MARKET_CATEGORIES.find((c) => c.slug === item.category)?.label} · GH₵{item.priceGhs.toLocaleString("en-GH")} · {item.condition} · {item.location || "No location given"}</p>
              <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">Seller: {item.sellerName} · WhatsApp: {item.sellerWhatsapp} · Submitted {new Date(item.createdAt).toLocaleString("en-GB")}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "approved" ? "bg-emerald-100 text-emerald-800" : item.status === "pending" ? "bg-amber-100 text-amber-900" : item.status === "sold" ? "bg-slate-200 text-slate-700" : "bg-red-100 text-red-800"}`}>{item.status}</span>
          </div>
          {item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-navy-800 dark:text-navy-200">{item.description}</p>}
          {item.imageUrls.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.imageUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`${item.title} photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" /></a>)}</div>}
          <div className="mt-4 flex flex-wrap gap-2">
            {item.status !== "approved" && item.status !== "sold" && <button disabled={busy === item.id} onClick={() => changeStatus(item.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Approve</button>}
            {item.status === "approved" && <button disabled={busy === item.id} onClick={() => changeStatus(item.id, "sold")} className="rounded-lg bg-navy-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Mark sold</button>}
            {item.status !== "rejected" && item.status !== "sold" && <button disabled={busy === item.id} onClick={() => changeStatus(item.id, "rejected")} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50">Reject</button>}
            {item.status === "sold" && <button disabled={busy === item.id} onClick={() => changeStatus(item.id, "approved")} className="rounded-lg border border-navy-300 px-3 py-2 text-xs font-bold text-navy-800 disabled:opacity-50">Reopen</button>}
          </div>
        </article>
      ))}
    </div>
  );
}
