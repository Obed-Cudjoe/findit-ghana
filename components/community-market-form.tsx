"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { COMMUNITY_MARKET_CATEGORIES } from "@/lib/community-market-categories";

const inputClass = "w-full rounded-xl border border-navy-200 bg-white px-3 py-3 text-base text-navy-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 dark:border-navy-700 dark:bg-navy-900 dark:text-white";

type ListingPreview = {
  title: string;
  category: string;
  price: string;
  condition: string;
  location: string;
  description: string;
  sellerName: string;
  sellerWhatsapp: string;
  photos: string[];
};

export function CommunityMarketForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState<ListingPreview | null>(null);
  const formDataRef = useRef<FormData | null>(null);

  function reviewListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    formDataRef.current = data;
    setPreview({
      title: String(data.get("title") ?? ""),
      category: String(data.get("category") ?? ""),
      price: String(data.get("priceGhs") ?? ""),
      condition: String(data.get("condition") ?? "unspecified"),
      location: String(data.get("location") ?? ""),
      description: String(data.get("description") ?? ""),
      sellerName: String(data.get("sellerName") ?? ""),
      sellerWhatsapp: String(data.get("sellerWhatsapp") ?? ""),
      photos: data.getAll("images").filter((file): file is File => file instanceof File && file.size > 0).map((file) => file.name),
    });
  }

  async function confirmSubmit() {
    if (!formDataRef.current || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/community-market/listings", { method: "POST", body: formDataRef.current });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not submit your listing. Please try again.");
        return;
      }
      setSubmitted(true);
      formDataRef.current = null;
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

  if (preview) {
    const categoryLabel = COMMUNITY_MARKET_CATEGORIES.find((category) => category.slug === preview.category)?.label ?? "Other";
    return (
      <section className="space-y-4" aria-label="Review your listing">
        <div className="rounded-2xl border border-navy-200 bg-navy-50 p-4 dark:border-navy-700 dark:bg-navy-950">
          <p className="text-xs font-bold uppercase tracking-wide text-gold-700 dark:text-gold-400">Review before submitting</p>
          <h2 className="mt-1 text-lg font-extrabold text-navy-900 dark:text-white">{preview.title}</h2>
          <p className="mt-1 font-bold text-navy-900 dark:text-white">{Number(preview.price) === 0 ? "Free" : `GH₵${Number(preview.price).toLocaleString("en-GH")}`}</p>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">{categoryLabel} · {preview.condition} · {preview.location || "No location"}</p>
          {preview.description && <p className="mt-3 whitespace-pre-wrap text-sm text-navy-800 dark:text-navy-200">{preview.description}</p>}
          <p className="mt-3 text-xs text-slate-soft dark:text-navy-300">Seller: {preview.sellerName} · WhatsApp: {preview.sellerWhatsapp}</p>
          {preview.photos.length > 0 && <p className="mt-2 text-xs text-slate-soft dark:text-navy-300">Photos: {preview.photos.join(", ")}</p>}
        </div>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300" role="alert">{error}</p>}
        <p className="text-xs text-slate-soft dark:text-navy-300">Submitting sends this listing to the admin queue. It is not public until approved.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => { setError(""); setPreview(null); }} className="flex-1 rounded-xl border border-navy-300 px-4 py-3 text-sm font-bold text-navy-900 dark:border-navy-700 dark:text-navy-100">Edit details</button>
          <button type="button" disabled={busy} onClick={() => void confirmSubmit()} className="flex-1 rounded-xl bg-gold-500 px-4 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 disabled:opacity-50">{busy ? "Sending…" : "Confirm & submit"}</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={reviewListing} className="space-y-4">
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
      <button type="submit" className="w-full rounded-xl bg-gold-500 px-5 py-3.5 text-base font-bold text-navy-950 hover:bg-gold-400">Review listing</button>
    </form>
  );
}
