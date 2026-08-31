import type { Metadata } from "next";
import Link from "next/link";
import { Search, ShieldCheck, Truck, Wallet, PackageOpen, EyeOff, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How FindIt Ghana works: search any product, compare vendors in cedis, and buy from the vendor — with no payments or stock ever held by us.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">How it works</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-soft dark:text-navy-300">Three steps between you and the honest price. No account. No prepayment to us. No surprises.</p>
      </header>

      <div className="mt-10 space-y-6">
        {[
          { icon: Search, title: "1 · Search any product", text: "Phones, laptops, cookers, consoles — anything. One search, one page of results in cedis." },
          { icon: ShieldCheck, title: "2 · Compare vendors in cedis", text: "Every vendor is named. Stock levels, delivery windows and delivery fees sit next to the price, with a last-checked timestamp on every listing." },
          { icon: Truck, title: "3 · Buy straight from the vendor", text: "We route you to the seller's own page — the sale happens there, under their terms. We show you the total before you click." },
        ].map((s) => (
          <div key={s.title} className="flex gap-4 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-6">
            <s.icon className="h-8 w-8 shrink-0 text-gold-600 dark:text-gold-500" strokeWidth={1.6} aria-hidden="true" />
            <div>
              <h2 className="font-bold text-navy-900 dark:text-navy-100">{s.title}</h2>
              <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-extrabold text-navy-900 dark:text-navy-100">On every listing you&apos;ll see</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Wallet, label: "Prices in cedis", text: "Never dollars, never 'call for price'." },
          { icon: PackageOpen, label: "Who has it in stock", text: "Units available, per vendor, right now." },
          { icon: Truck, label: "Delivery cost upfront", text: "The fee is next to the price — no surprise at the door." },
          { icon: ShieldCheck, label: "Last-checked on every listing", text: "Freshness you can verify, not a promise we ask you to trust blindly." },
        ].map((t) => (
          <div key={t.label} className="rounded-xl bg-navy-50 dark:bg-navy-900/60 p-5">
            <t.icon className="h-6 w-6 text-navy-700 dark:text-navy-300" strokeWidth={1.6} aria-hidden="true" />
            <p className="mt-2 font-bold text-navy-900 dark:text-navy-100">{t.label}</p>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">{t.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-extrabold text-navy-900 dark:text-navy-100">What we never do</h2>
      <div className="mt-4 rounded-xl border border-navy-100 dark:border-navy-800 p-6">
        <ul className="space-y-3 text-sm text-slate-soft dark:text-navy-300">
          <li className="flex gap-2"><EyeOff className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" /> We never take payments — there is nothing to prepay with us.</li>
          <li className="flex gap-2"><EyeOff className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" /> We never hold stock — we are not a shop.</li>
          <li className="flex gap-2"><EyeOff className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" /> We never hide delivery costs — the fee is on the table before you click.</li>
        </ul>
      </div>

      <p className="mt-10 text-center">
        <Link href="/search?q=phone" className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-4 text-base font-bold text-navy-950 shadow hover:bg-gold-400 transition-colors">
          Try a search — see for yourself <ArrowRight className="h-5 w-5" />
        </Link>
      </p>
    </div>
  );
}
