import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment status — FindIt Ghana",
  robots: { index: false, follow: false },
};

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ status?: string; reference?: string }> }) {
  const { status, reference } = await searchParams;
  const success = status === "success";
  const pending = status === "pending";

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <section className="rounded-2xl border border-navy-100 bg-white p-7 text-center shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <p className="text-4xl" aria-hidden="true">{success ? "✓" : pending ? "…" : "!"}</p>
        <h1 className="mt-3 text-2xl font-extrabold text-navy-900 dark:text-white">
          {success ? "Payment confirmed" : pending ? "Payment is still being checked" : "Payment not confirmed"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-soft dark:text-navy-300">
          {success
            ? "Paystack confirmed your payment. Your selected vendor plan is active for 30 days. Product listings still go through the normal FindIt review process."
            : pending
              ? "We have not confirmed this transaction yet. If you were charged, please do not pay again; contact FindIt Ghana support and include the reference below."
              : "We could not verify a successful payment. Your plan has not been activated. You can try checkout again from your vendor dashboard."}
        </p>
        {reference && (
          <p className="mt-4 break-all rounded-lg bg-navy-50 px-3 py-2 font-mono text-xs text-navy-800 dark:bg-navy-950 dark:text-navy-200">
            Reference: {reference}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/vendor" className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400">
            Vendor dashboard
          </Link>
          <Link href="/" className="rounded-xl border border-navy-200 px-5 py-3 text-sm font-semibold text-navy-900 hover:border-gold-400 dark:border-navy-700 dark:text-navy-100">
            Back to FindIt Ghana
          </Link>
        </div>
      </section>
    </main>
  );
}
