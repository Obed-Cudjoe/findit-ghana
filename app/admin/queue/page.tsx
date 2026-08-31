import type { Metadata } from "next";
import { readReports } from "@/lib/store";
import { QueueTable } from "./queue-table";

export const metadata: Metadata = { title: "Corrections & Reports Queue", robots: { index: false } };
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  price_error: "Price error", stock_error: "Stock error", delivery_error: "Delivery error", other: "Other", suspicious: "Suspicious",
};

export default async function QueuePage() {
  const reports = await readReports();
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-navy-900 px-3 py-1 font-bold text-white">{reports.length} total</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:text-amber-200">{reports.filter((r) => r.status === "new").length} new</span>
        <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">{reports.filter((r) => r.status === "checking").length} checking</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:text-emerald-200">{reports.filter((r) => r.status === "fixed").length} fixed</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{reports.filter((r) => r.status === "dismissed").length} dismissed</span>
      </div>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
          All clear — nothing waiting. Reports submitted on the public forms appear here instantly.
        </p>
      ) : (
        <QueueTable reports={reports.map((r) => ({ ...r, kindLabel: LABELS[r.kind] ?? r.kind }))} />
      )}
    </div>
  );
}
