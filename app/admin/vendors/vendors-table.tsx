"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert, X } from "lucide-react";
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
  listingLimitLabel: string;
  clicks: number;
  views: number;
  createdAt: string;
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-slate-100 text-slate-700",
  starter: "bg-gold-500/20 text-gold-700",
  pro: "bg-navy-900 text-white",
  unlimited: "bg-navy-950 text-gold-400 ring-1 ring-gold-500/60",
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
  const router = useRouter();
  const [rows, setRows] = useState(vendors);
  const [pending, startTransition] = useTransition();
  // Two-step delete confirm: which shop the admin is about to remove, if any.
  const [deleteTarget, setDeleteTarget] = useState<AdminVendorRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  /** Second step of the confirm dialog — actually deletes the shop. */
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || "Could not delete the shop. Please try again.");
        setDeleting(false);
        return;
      }
      startTransition(() => setRows((cur) => cur.filter((r) => r.id !== deleteTarget.id)));
      setDeleteTarget(null);
      setDeleting(false);
      router.refresh(); // keep counts on the page and any other admin state in sync
    } catch {
      setDeleteError("Network error — check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <>
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
                    <p className="font-semibold text-navy-900">{v.listingApproved} live / {v.listingLimitLabel} cap</p>
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
                      <button
                        disabled={pending}
                        onClick={() => patch(v.id, { action: "confirm-payment", plan: "unlimited" }, { plan: "unlimited", paymentStatus: "confirmed", status: "approved" })}
                        className="rounded-md border border-navy-950 bg-navy-950 px-2.5 py-1 text-xs font-extrabold text-gold-400 hover:bg-navy-900 transition-colors"
                      >
                        MoMo → Unlimited 30d
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
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(v);
                        }}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete shop
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-shop-title"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <p id="delete-shop-title" className="flex items-center gap-2 text-base font-extrabold text-red-700">
                <TriangleAlert className="h-5 w-5" /> Delete “{deleteTarget.businessName}”?
              </p>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Close"
                className="rounded-full p-1 text-slate-400 hover:bg-navy-50 hover:text-navy-900 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-soft">
              This removes the shop, all its listings and its photos, and cannot be undone.
            </p>
            <p className="mt-2 rounded-lg bg-navy-50 px-3 py-2 text-xs text-slate-soft">
              <strong className="font-semibold text-navy-900">{deleteTarget.listingTotal}</strong> listing
              {deleteTarget.listingTotal === 1 ? "" : "s"} · {deleteTarget.listingApproved} live ·{" "}
              <strong className="font-semibold text-navy-900">/{deleteTarget.slug}</strong>
              <span className="mt-1 block">Click events and buyer reports are kept as the audit trail.</span>
            </p>
            {deleteError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete shop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
