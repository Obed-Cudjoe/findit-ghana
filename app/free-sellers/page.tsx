import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Zap, Wallet } from "lucide-react";
import { VENDOR_PLANS, WEEKLY_FEATURED_DAYS, WEEKLY_FEATURED_PRICE_GHS, yearlySavingsGhs, yearlySavingsPct } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Free Means Free — Selling on FindIt Ghana",
  description: "On FindIt Ghana, listing is free and your products are never hidden behind a paywall. Featured placement is optional — GH₵50/month, and it's clearly labelled.",
};

export default function FreeSellersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700">For vendors</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Free means free.</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-soft">
          Other platforms charge you to list, then bury your ad unless you pay more. We don&apos;t play that game.
          Here&apos;s the whole story, in writing.
        </p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-white p-6 dark:border-navy-800 dark:bg-navy-900">
          <p className="flex items-center gap-2 font-extrabold text-navy-900 dark:text-white">
            <XCircle className="h-5 w-5 text-red-500" /> What other platforms do
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-soft">
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
            <li>Listing is free. Forever. No paywall, no &quot;boost to be seen&quot;.</li>
            <li>Approved listings appear in search, categories and the homepage — because they&apos;re approved, not because they paid.</li>
            <li>Featured placement is optional — a GH₵10 weekly boost, or from GH₵50/month, always clearly labelled ★ so buyers know it&apos;s an ad.</li>
            <li>Buyers contact you directly on WhatsApp. We take zero commission on your sale.</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {([
          { icon: Wallet, title: "Free", text: "Up to 3 live listings. Reviewed, visible, zero cost.", yearly: false },
          { icon: Zap, title: `Weekly boost — GH₵${WEEKLY_FEATURED_PRICE_GHS}/week`, text: `Pin ONE listing to the top of its category for ${WEEKLY_FEATURED_DAYS} days. Try being featured before you commit.`, yearly: false },
          { icon: ShieldCheck, title: "Starter — GH₵50/month", text: "Up to 10 listings with featured rotation in your category.", yearly: false },
          { icon: ShieldCheck, title: "Pro — GH₵100/month", text: "25 listings, homepage featured shop, per-vendor stats.", yearly: false },
          { icon: ShieldCheck, title: "Unlimited — GH₵200/month", text: "Unlimited listings, ranked above every other vendor, ∞ badge everywhere.", yearly: true },
        ] as { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; text: string; yearly: boolean }[]).map((p) => (
          <div key={p.title} className={`rounded-xl border bg-white p-5 dark:bg-navy-900 ${p.yearly ? "border-gold-500 ring-1 ring-gold-500/40" : "border-navy-100 dark:border-navy-800"}`}>
            <p.icon className="h-6 w-6 text-gold-600" strokeWidth={1.7} aria-hidden="true" />
            <p className="mt-2 font-bold text-navy-900 dark:text-white">{p.title}</p>
            <p className="mt-1 text-sm text-slate-soft">{p.text}</p>
            {p.yearly && (
              <div className="mt-3 rounded-lg bg-gold-500/15 px-3 py-2 text-center">
                <p className="text-sm font-extrabold text-navy-900 dark:text-gold-400">
                  GH₵{VENDOR_PLANS.unlimited.yearlyPriceGhs}/year
                </p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  You save GH₵{yearlySavingsGhs(VENDOR_PLANS.unlimited).toLocaleString("en-GH")} ({yearlySavingsPct(VENDOR_PLANS.unlimited)}% off)
                </p>
              </div>
            )}
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
