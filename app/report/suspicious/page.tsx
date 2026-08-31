import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ReportForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Report a Suspicious Vendor or Listing",
  description: "A vendor asked for payment and vanished, sent a fake, or won't refund? Report them — reports feed our checks queue and protect other shoppers.",
};

export default function ReportSuspiciousPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header>
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-navy-100 sm:text-3xl">Report a suspicious vendor or listing</h1>
        <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">
          A vendor asked for payment and vanished, sent a fake, or won&apos;t refund? Tell us — every report is reviewed by our checks team.
        </p>
        <p className="mt-2 inline-flex max-w-full items-start gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Reports like yours keep other shoppers safe.
        </p>
      </header>

      <div className="mt-6 rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 shadow-sm sm:p-6">
        <ReportForm kind="suspicious" />
      </div>
    </div>
  );
}
