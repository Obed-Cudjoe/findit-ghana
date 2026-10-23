"use client";

import { useState } from "react";
import Link from "next/link";
import { COMMUNITY_MARKET_CATEGORIES } from "@/lib/community-market-categories";

const inputClass = "w-full rounded-xl border border-navy-200 bg-white px-3 py-3 text-base text-navy-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white";

export function CommunityMarketForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/community-market/listings", { method: "POST", body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not submit your listing. Please try again.");
        return;
      }
      setSubmitted(true);
      form.reset();
    } catch {
      setError("Connection problem. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20" role="status">
        <h2 className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200">Listing sent for review</h2>
        <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-200">It will appear on the market page only after an admin approves it. We do not independently verify items, sellers or prices.</p>
        <Link href="/community-market" className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600">Back to the market</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Item or service name *</span><input name="title" required minLength={3} maxLength={100} className={inputClass} placeholder="e.g. Used HP laptop, size 42 trainers" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Category *</span><select name="category" required defaultValue="" className={inputClass}><option value="" disabled>Choose a category</option>{COMMUNITY_MARKET_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Price in GHS *</span><input name="priceGhs" required type="number" min="0" step="0.01" className={inputClass} placeholder="0 for free" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Condition</span><select name="condition" defaultValue="unspecified" className={inputClass}><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option><option value="unspecified">Not stated</option></select></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Location (optional)</span><input name="location" maxLength={100} className={inputClass} placeholder="e.g. Ho, Accra, near campus" /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Description (optional)</span><textarea name="description" maxLength={1200} rows={4} className={inputClass} placeholder="Condition, size, what's included, collection or delivery details…" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">Seller name *</span><input name="sellerName" required maxLength={80} className={inputClass} placeholder="Name buyers should see" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">WhatsApp number *</span><input name="sellerWhatsapp" required type="tel" inputMode="tel" className={inputClass} placeholder="e.g. 024 000 0000" /></label>
        <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-semibold">Photos (optional, up to 6)</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple className="block w-full rounded-xl border border-navy-200 bg-white px-3 py-3 text-sm dark:border-navy-700 dark:bg-navy-900" /><span className="mt-1 block text-xs text-slate-soft dark:text-navy-300">JPG, PNG or WebP, up to 3 MB each. Clear photos help buyers assess the item.</span></label>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
        <input type="checkbox" name="publicConsent" value="yes" required className="mt-1 h-4 w-4 accent-amber-600" />
        <span>I understand that if approved, my seller name, WhatsApp number, photos and listing details will be visible to anyone with the market link. Listings are not independently verified.</span>
      </label>
      <button type="submit" disabled={busy} className="w-full rounded-xl bg-gold-500 px-5 py-3.5 text-base font-bold text-navy-950 hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60">{busy ? "Sending for review…" : "Submit listing for review"}</button>
    </form>
  );
}
