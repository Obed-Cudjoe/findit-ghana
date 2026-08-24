"use client";

// Admin review table for vendor listings: approve → live on the site,
// reject → hidden. Approving makes the product searchable immediately.
import { useState, useTransition } from "react";

export interface ListingRow {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  productName: string;
  category: string;
  priceGhs: number;
  stockCount: number | null;
  deliveryZone: string;
  deliveryFeeGhs: number;
  description: string;
  websiteUrl: string;
  status: string;
  createdAt: string;
}

const BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-slate-100 text-slate-600",
};

export function ListingsTable({ listings }: { listings: ListingRow[] }) {
  const [rows, setRows] = useState(listings);
  const [pending, startTransition] = useTransition();

  async function setStatus(id: string, status: string) {
    const prev = rows;
    startTransition(() => setRows(rows.map((r) => (r.id === id ? { ...r, status } : r))));
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setRows(prev);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-slate-soft">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Business / contact</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy-900">{l.productName}</p>
                  <p className="text-xs text-slate-soft capitalize">{l.category.replace("-", " & ")} · {l.stockCount ?? "no stock"} units</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-soft">
                  <p className="font-semibold text-navy-800">{l.businessName}</p>
                  <p>{l.contactName} · +{l.phone}</p>
                  <p>{l.email || "no email"}</p>
                </td>
                <td className="px-4 py-3 font-bold text-navy-900">
                  GH₵{l.priceGhs.toLocaleString("en-GH")}
                  <p className="text-xs font-normal text-slate-soft">+ {l.deliveryFeeGhs} delivery · {l.deliveryZone}</p>
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-soft">
                  <p className="line-clamp-2">{l.description}</p>
                  {l.websiteUrl && <a href={l.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-navy-500 underline">link ↗</a>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[l.status] ?? "bg-slate-100 text-slate-600"}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button disabled={pending} onClick={() => setStatus(l.id, "approved")} className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">
                      Approve → live
                    </button>
                    <button disabled={pending} onClick={() => setStatus(l.id, "rejected")} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
