import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { ReportForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Report a Price or Stock Error",
  description: "Saw a wrong price, stock level or delivery detail? Report it — we fix or remove it within 1 business day.",
};

export default async function ReportPricePage({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy-900">Report a price or stock error</h1>
        <p className="mt-2 text-sm text-slate-soft">
          Saw a wrong price, stock level or delivery detail? Tell us — we fix or remove it within 1 business day.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-xs text-navy-700">
          <Clock className="h-3.5 w-3.5 text-gold-600" /> The correction promise is a workflow, not a slogan.
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <ReportForm kind="price" />
      </div>

      {listing && (
        <p className="mt-3 text-xs text-slate-soft">
          Listing: <span className="font-mono break-all">{listing}</span>
        </p>
      )}
    </div>
  );
}
