"use client";

/* Admin: create a listing on behalf of a vendor who sent their details via
   WhatsApp (Option B flow). Multipart submit so photos upload in the same
   request. */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "phones", label: "Phones" },
  { slug: "laptops", label: "Laptops" },
  { slug: "tv-audio", label: "TVs & Audio" },
  { slug: "appliances", label: "Appliances" },
  { slug: "gaming", label: "Gaming" },
  { slug: "fashion", label: "Fashion" },
];

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-base text-navy-900 placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-shadow dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100";

export function AddListingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState<{ slug: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    productName: "",
    priceGhs: "",
    category: "",
    stockCount: "",
    deliveryZone: "Ghana",
    deliveryDaysMin: "1",
    deliveryDaysMax: "3",
    deliveryFeeGhs: "0",
    description: "",
    websiteUrl: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) fd.append(k, v);
      for (const f of photos) fd.append("images", f);
      const res = await fetch("/api/admin/listings", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setOk({ slug: data.slug });
        router.refresh();
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-700 dark:bg-emerald-900/30">
        <p className="font-extrabold text-emerald-900 dark:text-emerald-200">Listing is LIVE ✅</p>
        <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-200">
          Approved automatically (you are the checks team). Product page:{" "}
          <a href={`/product/${ok.slug}`} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            /product/{ok.slug}
          </a>
        </p>
        <button
          type="button"
          onClick={() => {
            // Keep the vendor's details, clear only the product fields —
            // the same vendor's next product is usually one edit away.
            setOk(null);
            setForm((f) => ({ ...f, productName: "", priceGhs: "", category: "", stockCount: "", deliveryZone: "Ghana", deliveryDaysMin: "1", deliveryDaysMax: "3", deliveryFeeGhs: "0", description: "" }));
            setPhotos([]);
          }}
          className="mt-4 rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white hover:bg-navy-700"
        >
          Add another product for the same vendor
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-xl bg-navy-50/70 p-4 dark:bg-navy-900/50">
        <p className="text-sm font-bold text-navy-900 dark:text-navy-100">Vendor (from their WhatsApp message)</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Business name *</span>
            <input className={inputCls} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. High Spirit iShop" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Phone / WhatsApp *</span>
            <input className={inputCls} inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0504280223" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Contact name</span>
            <input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Who buyers talk to" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">TikTok / Facebook link (optional)</span>
            <input className={inputCls} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://tiktok.com/@their-shop" />
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-gold-500/10 p-4 ring-1 ring-gold-500/30">
        <p className="text-sm font-bold text-navy-900 dark:text-navy-100">Product (from their message)</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Product name *</span>
            <input className={inputCls} value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder="e.g. iPhone 13 Pro 128GB, UK used" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Price (GH₵) *</span>
            <input className={inputCls} inputMode="decimal" value={form.priceGhs} onChange={(e) => set("priceGhs", e.target.value)} placeholder="5500" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Category *</span>
            <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)} required>
              <option value="">Pick a category</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Stock (optional)</span>
            <input className={inputCls} inputMode="numeric" value={form.stockCount} onChange={(e) => set("stockCount", e.target.value)} placeholder="e.g. 5 — leave empty if unknown" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Delivery zone</span>
            <input className={inputCls} value={form.deliveryZone} onChange={(e) => set("deliveryZone", e.target.value)} placeholder="e.g. Accra & Kumasi" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Delivery days (min–max)</span>
            <div className="flex gap-2">
              <input className={inputCls} inputMode="numeric" value={form.deliveryDaysMin} onChange={(e) => set("deliveryDaysMin", e.target.value)} aria-label="Minimum delivery days" />
              <span className="self-center text-slate-soft dark:text-navy-300">to</span>
              <input className={inputCls} inputMode="numeric" value={form.deliveryDaysMax} onChange={(e) => set("deliveryDaysMax", e.target.value)} aria-label="Maximum delivery days" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Delivery fee (GH₵)</span>
            <input className={inputCls} inputMode="decimal" value={form.deliveryFeeGhs} onChange={(e) => set("deliveryFeeGhs", e.target.value)} placeholder="0 = free" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Photos from their WhatsApp ({photos.length} selected)</span>
            <input
              className="block w-full text-sm text-slate-soft dark:text-navy-300 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
            <span className="mt-1 block text-[11px] text-slate-soft dark:text-navy-300">
              Tip: save their photos to your phone/computer first (WhatsApp Web → right-click → Save image).
            </span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">Short description (optional)</span>
            <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Clean UK used, battery 92%, free delivery in Accra" />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-navy-950 shadow hover:bg-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        {busy ? "Publishing…" : "Publish listing — goes live immediately ✅"}
      </button>
    </form>
  );
}
