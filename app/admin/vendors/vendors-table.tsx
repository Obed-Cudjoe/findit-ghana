"use client";

import { useState, useTransition } from "react";
import type { VendorPlanId } from "@/lib/types";

export interface AdminVendorRow {
  id: string;
  businessName: string;
  slug: string;
  contactName: string;
  phone: string;
  email: string;
  plan: VendorPlanId;
  planExpiresAt: string | null;
  paymentStatus: string;
  verified: boolean;
  status: string;
  listingTotal: number;
  listingApproved: number;
  listingPending: number;
  listingLimit: number;
  clicks: number;
  views: number;
  createdAt: string;
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-gold-500/20 text-gold-700",
  pro: "bg-navy-900 text-white",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-slate-100 text-slate-600",
};

function expiryLabel(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const days = Math.ceil((t - Date.now()) / 86_400_000);
  const pretty = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (days < 0) return `expired ${pretty}`;
  return `${pretty} (${days}d)`;
}

export function VendorsTable({ vendors }: { vendors: AdminVendorRow[] }) {
  const [rows, setRows] = useState(vendors);
  const [pending, startTransition] = useTransition();

  async function patch(id: string, body: Record<string, unknown>, optimistic: Partial<AdminVendorRow>) {
    const prev = rows;
    startTransition(() => setRows(rows.map((r) => (r.id === id ? { ...r, ...optimistic } : r))));
    const res = await fetch(`/api/admin/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) setRows(prev);
    else if (body.action === "confirm-payment") {
      const data = await res.json().catch(() => ({}));
      startTransition(() =>
        setRows((cur) =>
          cur.map((r) =>
            r.id === id
              ? {
                  ...r,
                  plan: (data.plan as VendorPlanId) ?? r.plan,
                  planExpiresAt: (data.planExpiresAt as string) ?? r.planExpiresAt,
                  paymentStatus: "confirmed",
                  status: "approved",
                }
              : r,
          ),
        ),
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <p className="border-b border-navy-100 bg-navy-50/60 px-4 py-2 text-xs text-slate-400 lg:hidden">Swipe the table sideways to see all columns →</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-slate-soft">
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Plan / expiry</th>
              <th className="px-4 py-3">Listings</th>
              <th className="px-4 py-3">Stats</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy-900">
                    {v.businessName}
                    {v.verified && <span className="ml-1.5 text-[10px] font-bold uppercase text-emerald-700">verified</span>}
                  </p>
                  <p className="text-xs text-slate-soft">{v.contactName || "—"} · +{v.phone}</p>
                  <p className="text-xs text-slate-400">/{v.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PLAN_BADGE[v.plan] ?? "bg-slate-100"}`}>{v.plan}</span>
                  <p className="mt-1 text-xs text-slate-soft">{v.paymentStatus} · {expiryLabel(v.planExpiresAt)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-soft">
                  <p className="font-semibold text-navy-900">{v.listingApproved} live / {v.listingLimit} cap</p>
                  <p>{v.listingPending} pending · {v.listingTotal} total</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-soft">
                  <p><span className="font-semibold text-navy-900">{v.clicks}</span> clicks</p>
                  <p><span className="font-semibold text-navy-900">{v.views}</span> shop views</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[v.status] ?? "bg-slate-100"}`}>{v.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {v.status !== "approved" && (
                      <button
                        disabled={pending}
                        onClick={() => patch(v.id, { status: "approved" }, { status: "approved" })}
                        className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        Approve shop
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() => patch(v.id, { action: "confirm-payment", plan: "starter" }, { plan: "starter", paymentStatus: "confirmed", status: "approved" })}
                      className="rounded-md border border-gold-600 bg-gold-500/10 px-2.5 py-1 text-xs font-bold text-gold-700 hover:bg-gold-500/20 transition-colors"
                    >
                      MoMo → Starter 30d
                    </button>
                    <button
                      disabled={pending}
                      onClick={() => patch(v.id, { action: "confirm-payment", plan: "pro" }, { plan: "pro", paymentStatus: "confirmed", status: "approved" })}
                      className="rounded-md border border-navy-800 bg-navy-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-navy-800 transition-colors"
                    >
                      MoMo → Pro 30d
                    </button>
                    {v.plan !== "free" && (
                      <button
                        disabled={pending}
                        onClick={() => patch(v.id, { action: "set-free" }, { plan: "free", paymentStatus: "none", planExpiresAt: null })}
                        className="rounded-md border border-navy-200 px-2.5 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-50 transition-colors"
                      >
                        Set Free
                      </button>
                    )}
                    <button
                      disabled={pending}
                      onClick={() => patch(v.id, { verified: !v.verified }, { verified: !v.verified })}
                      className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      {v.verified ? "Unverify" : "Verify"}
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
