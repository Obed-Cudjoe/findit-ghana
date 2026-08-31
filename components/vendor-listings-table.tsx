"use client";

// Vendor dashboard — the vendor's own listings table, with an Edit button per
// row that expands an inline form for price / stock / delivery fee / delivery
// days / description. Saves via PATCH /api/vendor/listings/[id], then updates
// the row and the server-rendered page immediately (router.refresh()). Edits
// to approved listings go live right away — no re-review.
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check } from "lucide-react";
import type { VendorListing } from "@/lib/types";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-slate-100 text-slate-600",
};

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-shadow";

const MAX_PRICE_GHS = 10_000_000;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-navy-900">{label}</span>
      {children}
    </label>
  );
}

function EditForm({
  listing,
  onCancel,
  onSaved,
}: {
  listing: VendorListing;
  onCancel: () => void;
  onSaved: (updated: Partial<VendorListing>) => void;
}) {
  const [form, setForm] = useState({
    productName: listing.productName ?? "",
    priceGhs: String(listing.priceGhs),
    stockCount: listing.stockCount === null || listing.stockCount === undefined ? "" : String(listing.stockCount),
    deliveryFeeGhs: String(listing.deliveryFeeGhs ?? 0),
    deliveryDaysMin: String(listing.deliveryDaysMin ?? 1),
    deliveryDaysMax: String(listing.deliveryDaysMax ?? 3),
    description: listing.description ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError("");

    const name = form.productName.trim();
    if (name.length < 3 || name.length > 140) {
      setError("Product name must be 3–140 characters.");
      return;
    }

    const price = Number(form.priceGhs);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_GHS) {
      setError("Enter a valid price in cedis.");
      return;
    }
    const stock =
      form.stockCount.trim() === ""
        ? null
        : (() => {
            const n = Number(form.stockCount);
            return Number.isFinite(n) && n >= 0 ? Math.round(n) : Number.NaN;
          })();
    if (stock !== null && Number.isNaN(stock)) {
      setError("Stock must be a number of units (or empty).");
      return;
    }
    const fee = Number(form.deliveryFeeGhs);
    if (!Number.isFinite(fee) || fee < 0) {
      setError("Delivery fee must be a number in cedis (0 if free).");
      return;
    }
    if (form.description.trim().length < 20) {
      setError("Describe the product (at least 20 characters).");
      return;
    }
    const min = Math.max(1, Math.min(60, Math.round(Number(form.deliveryDaysMin) || 1)));
    const max = Math.max(min, Math.min(60, Math.round(Number(form.deliveryDaysMax) || min)));

    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          priceGhs: price,
          stockCount: stock,
          deliveryFeeGhs: Math.round(fee),
          deliveryDaysMin: min,
          deliveryDaysMax: max,
          description: form.description.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save — please try again.");
        setSaving(false);
        return;
      }
      onSaved(data.listing ?? {});
    } catch {
      setError("Network error — check your connection and try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-3 rounded-xl border border-gold-500/50 bg-gold-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-navy-900">Edit “{listing.productName}”</p>
        <p className="text-xs text-slate-soft">
          {listing.status === "approved"
            ? "Changes go live immediately on the product page."
            : `Pending listing — changes are saved; it still needs approval to appear.`}
        </p>
      </div>
      <Field label="Product name (renaming keeps your listing link)">
        <input
          className={inputCls}
          value={form.productName}
          onChange={(e) => set("productName", e.target.value)}
          placeholder="e.g. iPhone 13 (128GB)"
          maxLength={140}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Price (GHS)">
          <input className={inputCls} value={form.priceGhs} onChange={(e) => set("priceGhs", e.target.value)} inputMode="numeric" required />
        </Field>
        <Field label="Units in stock (optional)">
          <input className={inputCls} value={form.stockCount} onChange={(e) => set("stockCount", e.target.value)} inputMode="numeric" placeholder="empty = ask vendor" />
        </Field>
        <Field label="Delivery fee (GHS)">
          <input className={inputCls} value={form.deliveryFeeGhs} onChange={(e) => set("deliveryFeeGhs", e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Delivery days (from)">
          <input className={inputCls} value={form.deliveryDaysMin} onChange={(e) => set("deliveryDaysMin", e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Delivery days (to)">
          <input className={inputCls} value={form.deliveryDaysMax} onChange={(e) => set("deliveryDaysMax", e.target.value)} inputMode="numeric" />
        </Field>
      </div>
      <Field label="Description (at least 20 characters)">
        <textarea
          className={`${inputCls} min-h-20`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Condition, warranty, colour options — what should buyers know?"
        />
      </Field>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
        >
          <Check className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-60 transition-colors"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </form>
  );
}

export function VendorListingsTable({ listings }: { listings: VendorListing[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(listings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [reconfirmingId, setReconfirmingId] = useState<string | null>(null);

  // "Still available" — bumps the freshness clock so the listing never
  // slides into stale territory (freshness enforcement feature).
  async function reconfirm(l: VendorListing) {
    setReconfirmingId(l.id);
    try {
      const res = await fetch(`/api/vendor/listings/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reconfirm: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows((cur) => cur.map((r) => (r.id === l.id ? { ...r, updatedAt: data.listing?.updatedAt ?? new Date().toISOString() } : r)));
        setSavedId(l.id);
        window.setTimeout(() => setSavedId((cur) => (cur === l.id ? null : cur)), 4000);
        router.refresh();
      }
    } catch {
      /* network error — leave state unchanged */
    } finally {
      setReconfirmingId(null);
    }
  }

  function onSaved(updated: Partial<VendorListing>) {
    if (!editingId) return;
    setRows((cur) => cur.map((r) => (r.id === editingId ? { ...r, ...updated } : r)));
    setEditingId(null);
    setSavedId(editingId);
    router.refresh(); // keep the server-rendered page (caps, counts) in sync
    window.setTimeout(() => setSavedId((cur) => (cur === editingId ? null : cur)), 4000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <p className="border-b border-navy-100 bg-navy-50/60 px-4 py-2 text-xs text-slate-400 lg:hidden">Swipe the table sideways →</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-slate-soft">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Photos</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((l) => {
              const photos = l.imageUrls ?? [];
              const editing = editingId === l.id;
              return (
                <Fragment key={l.id}>
                  <tr className={editing ? "bg-gold-500/5" : ""}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-900">{l.productName}</p>
                      <p className="text-xs text-slate-soft">{l.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      {photos.length > 0 ? (
                        <span className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photos[0]}
                            alt={`First photo of ${l.productName}`}
                            className="h-10 w-10 rounded-md border border-navy-100 object-cover"
                            loading="lazy"
                          />
                          <span className="text-xs font-semibold text-slate-soft">×{photos.length}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy-900">GH₵{l.priceGhs.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[l.status] ?? "bg-slate-100"}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-soft">
                      {new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editing ? (
                        <span className="text-xs font-semibold text-slate-soft">editing…</span>
                      ) : (
                        <span className="inline-flex flex-wrap justify-end gap-1.5">
                          {l.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => reconfirm(l)}
                              disabled={reconfirmingId === l.id}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 transition-colors"
                            >
                              {reconfirmingId === l.id ? "Confirming…" : "✓ Still available"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(l.id);
                              setSavedId(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-navy-200 px-2.5 py-1 text-xs font-semibold text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {editing && (
                    <tr>
                      <td colSpan={6} className="bg-gold-500/5 px-4 py-3">
                        <EditForm
                          listing={l}
                          onCancel={() => setEditingId(null)}
                          onSaved={onSaved}
                        />
                      </td>
                    </tr>
                  )}
                  {savedId === l.id && (
                    <tr>
                      <td colSpan={6} className="bg-emerald-50 px-4 py-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800" role="status">
                          <Check className="h-4 w-4" /> Saved — the new price is live on your product page.
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
