import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Clock, Store, TriangleAlert, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Trust & Methodology — How We Keep Prices Honest",
  description: "How FindIt Ghana keeps prices honest: named vendors, daily checks, a public correction promise and a reports queue reviewed by a real team.",
};

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy-900">How we keep prices honest</h1>
        <p className="mt-3 max-w-2xl text-slate-soft">Anyone can publish a price. Keeping it honest takes rules — these are ours, and every one of them is checkable by you.</p>
      </header>

      <section className="mt-10 space-y-8">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><Clock className="h-5 w-5 text-gold-600" /> Where prices come from</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-soft">
            Prices come from vendor catalogues and public listings, refreshed on a schedule — at minimum once a day. Every listing carries a
            <strong className="text-navy-900"> last-checked timestamp</strong>, so you can see exactly how fresh the number you&apos;re looking at is.
            Stale data is labelled, never dressed up as fresh.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Our correction promise</h2>
          <div className="mt-2 rounded-xl border-2 border-gold-500 bg-gold-500/10 p-5">
            <p className="text-sm leading-relaxed text-navy-900">
              <strong>Saw something wrong? We fix or remove any reported error within 1 business day.</strong> Not a slogan — a workflow.
              Every report gets a reference number, lands in our checks queue, and is either fixed or dismissed with a reason. You can report a
              <Link className="font-semibold text-navy-700 underline" href="/report/price"> price or stock error</Link> or a
              <Link className="font-semibold text-navy-700 underline" href="/report/suspicious"> suspicious listing</Link> in under a minute.
            </p>
          </div>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><Store className="h-5 w-5 text-navy-600" /> How vendors appear</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-soft">
            Every listing names its vendor — never an anonymous seller. Verified vendors display a badge after identity and history checks.
            We publish the vendor&apos;s name and the timestamp of the check, and we never mix their listings with anyone else&apos;s.
          </p>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><TriangleAlert className="h-5 w-5 text-amber-600" /> What looks suspicious — the four warning signs</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-soft">
            <li><strong className="text-navy-900">Too cheap to be true.</strong> A price far below every other vendor&apos;s is the oldest trick in the book.</li>
            <li><strong className="text-navy-900">Prepayment demanded first.</strong> Especially with no pay-on-delivery option and pressure to act fast.</li>
            <li><strong className="text-navy-900">No named vendor.</strong> Anonymous pages hide because they plan to disappear.</li>
            <li><strong className="text-navy-900">Delivery costs mentioned later.</strong> The surprise fee that turns a bargain into a bad deal.</li>
          </ul>
        </div>
      </section>

      <p className="mt-10 text-center">
        <Link href="/report/price" className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800 transition-colors">
          Found a problem? Report it <ArrowRight className="h-4 w-4" />
        </Link>
      </p>
    </div>
  );
}
