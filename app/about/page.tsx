import type { Metadata } from "next";
import Link from "next/link";
import { Flag, HeartHandshake, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Why we built FindIt Ghana: because finding a fair price in Ghana shouldn't take six tabs, three forums and a Telegram group.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy-900">Why we built this</h1>
      </header>

      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-soft">
        <p>
          Finding a fair price in Ghana shouldn&apos;t take six tabs, three forums and a Telegram group. But that&apos;s exactly what it takes today:
          one price on a marketplace, another in a WhatsApp status, a third from an importer who quotes in dollars — and none of them mention
          delivery until it&apos;s time to pay.
        </p>
        <p>
          We built <strong className="text-navy-900">FindIt Ghana</strong> to put every honest answer on one page: real prices in cedis, live stock,
          delivery costs, and the name of the vendor behind each number. No anonymous sellers. No hidden fees. No &apos;call for price&apos;.
        </p>
        <p>
          We don&apos;t sell anything ourselves. We never take payments and we never hold stock — we simply show you the honest picture, and route you
          to the vendor when you&apos;re ready. Our business model is affiliate links and featured placements, which means we only succeed when
          you buy at a price you&apos;re happy with.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-extrabold text-navy-900">What we believe</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-soft">
        <li className="flex gap-3"><Flag className="h-5 w-5 shrink-0 text-gold-600" /> Prices in cedis — never dollars, never &apos;ask&apos;.</li>
        <li className="flex gap-3"><Flag className="h-5 w-5 shrink-0 text-gold-600" /> Named vendors only — anonymity is how scams hide.</li>
        <li className="flex gap-3"><Flag className="h-5 w-5 shrink-0 text-gold-600" /> No surprises at delivery — the total is on the table first.</li>
      </ul>

      <h2 className="mt-10 text-xl font-extrabold text-navy-900">The founder</h2>
      <p className="mt-2 text-sm text-slate-soft">
        Built by Obed Cudjoe — a one-person operation in Accra, obsessed with honest prices. <HeartHandshake className="inline h-4 w-4 text-gold-600" aria-hidden="true" /> I started
        FindIt Ghana after one too many friends lost money to a vendor they couldn&apos;t verify — and I run the checks queue myself, every
        business day.
      </p>
      <p className="mt-3 text-sm">
        <a href="https://www.linkedin.com/in/obed-cudjoe" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy-700 underline hover:text-gold-700">
          Connect on LinkedIn <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </p>

      <p className="mt-10">
        <Link href="/search?q=phone" className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 transition-colors">
          See it in action — try a search <ArrowRight className="h-4 w-4" />
        </Link>
      </p>
    </div>
  );
}
