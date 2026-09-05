"use client";

/* Admin moderation queue for COMP-19 actual-price submissions. */

import { useEffect, useState } from "react";
import { Check, EyeOff, LoaderCircle } from "lucide-react";
import { formatGHS } from "@/lib/utils";

interface Row {
  id: string;
  productSlug: string;
  pricePaidGhs: number;
  shopName?: string;
  paidAt: string;
  status: "new" | "approved" | "hidden";
  createdAt: string;
}

export function AdminActualPrices() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/actual-prices");
      if (res.ok) setRows((await res.json()).rows);
    } catch {
      /* leave as-is */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: "approved" | "hidden") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/actual-prices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  const pending = (rows ?? []).filter((r) => r.status === "new");

  return (
    <div className="mt-8">
      <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">
        Actual prices paid <span className="ml-1 text-sm font-semibold text-slate-soft dark:text-navy-300">(approve before they show publicly)</span>
      </h2>
      {rows === null ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-soft dark:text-navy-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : pending.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-6 text-center text-sm text-slate-soft dark:text-navy-300">
          Nothing waiting — shopper submissions land here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-navy-100 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
          {pending.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="font-bold text-navy-900 dark:text-navy-100">{formatGHS(r.pricePaidGhs)}</span>
                <span className="ml-2 text-slate-soft dark:text-navy-300 truncate">
                  {r.shopName || "no shop"} · {r.productSlug.slice(0, 40)}…
                </span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => setStatus(r.id, "approved")}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => setStatus(r.id, "hidden")}
                  className="inline-flex items-center gap-1 rounded-lg bg-navy-100 px-3 py-1.5 text-xs font-bold text-navy-700 hover:bg-navy-200 disabled:opacity-60 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
                >
                  <EyeOff className="h-3.5 w-3.5" /> Hide
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
