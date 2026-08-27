"use client";

import { useState, useTransition } from "react";

interface QueueRow {
  id: string;
  refCode: string;
  kindLabel: string;
  vendorName: string;
  detail: string;
  listingUrl: string;
  reporterEmail: string;
  status: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-800",
  checking: "bg-blue-100 text-blue-800",
  fixed: "bg-emerald-100 text-emerald-800",
  dismissed: "bg-slate-100 text-slate-600",
};

export function QueueTable({ reports }: { reports: QueueRow[] }) {
  const [rows, setRows] = useState(reports);
  const [pending, startTransition] = useTransition();

  async function setStatus(id: string, status: string) {
    const prev = rows;
    startTransition(() => setRows(rows.map((r) => (r.id === id ? { ...r, status } : r))));
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) setRows(prev);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy-100 bg-white">
      <p className="border-b border-navy-100 bg-navy-50/60 px-4 py-2 text-xs text-slate-400 lg:hidden">Swipe the table sideways to see all columns →</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-slate-soft">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Detail</th>
              <th className="px-4 py-3">Reported</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-navy-900">{r.refCode}</td>
                <td className="px-4 py-3 font-semibold text-navy-800">{r.kindLabel}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-slate-soft">
                  <p className="line-clamp-2">{r.detail}</p>
                  {r.listingUrl && <a href={r.listingUrl} target="_blank" rel="noopener noreferrer" className="text-navy-500 underline">listing link ↗</a>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-soft">{new Date(r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[r.status] ?? "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button disabled={pending} onClick={() => setStatus(r.id, "checking")} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors">Check</button>
                    <button disabled={pending} onClick={() => setStatus(r.id, "fixed")} className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors">Fixed</button>
                    <button disabled={pending} onClick={() => setStatus(r.id, "dismissed")} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Dismiss</button>
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
