import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Zap, Wallet } from "lucide-react";
import { VENDOR_PLANS, WEEKLY_FEATURED_DAYS, WEEKLY_FEATURED_PRICE_GHS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Free Means Free — Selling on FindIt Ghana",
  description: "List up to 3 products free on FindIt Ghana. Optional seller plans start at GH₵30/month, with transparent listing limits and clearly labelled featured placement.",
};

export default function FreeSellersPage() {
  const offers = [
    { icon: Wallet, title: "Free", text: `Up to ${VENDOR_PLANS.free.listingLimit} live listings. Reviewed, visible, zero cost.` },
    { icon: Zap, title: `Weekly boost — GH₵${WEEKLY_FEATURED_PRICE_GHS}/week`, text: `Pin ONE listing to the top of its category for ${WEEKLY_FEATURED_DAYS} days. Try a boost without a monthly plan.` },
    { icon: ShieldCheck, title: `${VENDOR_PLANS.starter.name} — GH₵${VENDOR_PLANS.starter.priceGhs}/month`, text: `Up to ${VENDOR_PLANS.starter.listingLimit} listings with featured rotation in your category.` },
    { icon: ShieldCheck, title: `${VENDOR_PLANS.pro.name} — GH₵${VENDOR_PLANS.pro.priceGhs}/month`, text: `Up to ${VENDOR_PLANS.pro.listingLimit} listings, homepage featuring and shop stats.` },
    { icon: ShieldCheck, title: `${VENDOR_PLANS.unlimited.name} — GH₵${VENDOR_PLANS.unlimited.priceGhs}/month`, text: `Up to ${VENDOR_PLANS.unlimited.listingLimit} listings, homepage featuring and shop stats.` },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">For vendors</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Free means free.</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-soft dark:text-navy-300">
          Other platforms charge you to list, then bury your ad unless you pay more. We don&apos;t play that game.
          Here&apos;s the whole story, in writing.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-6 dark:border-navy-800 dark:bg-navy-900">
          <p className="flex items-center gap-2 font-extrabold text-navy-900 dark:text-white">
            <XCircle className="h-5 w-5 text-red-500" /> What other platforms do
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-soft dark:text-navy-300">
            <li>&quot;Free to post&quot; — then your ad stops showing unless you buy a package.</li>
            <li>Ads deliberately ranked below paid ones, so free listings get no views.</li>
            <li>Sales calls pushing higher packages every week.</li>
            <li>You pay, and still wonder whether anyone saw your product.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="flex items-center gap-2 font-extrabold text-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" /> What FindIt Ghana does
          </p>
          <ul className="mt-4 space-y-3 text-sm text-emerald-900 dark:text-emerald-200">
            <li>Up to 3 listings are free. Paid plans are optional if you need more space or seller tools.</li>
            <li>Approved listings can appear in search and categories; payment is not required to list.</li>
            <li>Optional featured placement starts with a GH₵10 weekly boost or paid plans from GH₵30/month. Paid placement is labelled.</li>
            <li>Buyers contact you directly on WhatsApp. We take zero commission on your sale.</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((p) => (
          <div key={p.title} className="rounded-xl border border-navy-100 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
            <p.icon className="h-6 w-6 text-gold-600 dark:text-gold-500" strokeWidth={1.7} aria-hidden="true" />
            <p className="mt-2 font-bold text-navy-900 dark:text-white">{p.title}</p>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">{p.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-navy-900 p-8 text-center dark:bg-navy-900">
        <h2 className="text-xl font-extrabold text-white">List your first product free — 2 minutes</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy-100">
          A TikTok or Facebook link is enough. We review every listing before it goes live — usually within one business day.
        </p>
        <Link
          href="/for-vendors"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 transition-colors"
        >
          Start listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
