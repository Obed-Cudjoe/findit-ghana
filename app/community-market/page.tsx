import type { Metadata } from "next";
import Link from "next/link";
import { CommunityMarketBrowser } from "@/components/community-market-browser";
import { readCommunityMarketListings } from "@/lib/community-market";

const GROUP_URL = "https://chat.whatsapp.com/FgGGX2aJUOi0YdymzmDB48";

export const metadata: Metadata = {
  title: "Community Market — FindIt Ghana",
  description: "Browse community-submitted items and services. Contact sellers directly on WhatsApp.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function CommunityMarketPage() {
  const listings = await readCommunityMarketListings();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav className="text-sm text-slate-soft dark:text-navy-300"><Link href="/" className="underline">FindIt Ghana</Link><span aria-hidden="true"> / </span><span>Community Market</span></nav>
      <header className="mt-5 rounded-3xl bg-navy-950 px-6 py-9 text-white sm:px-10 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-400">Community listings · Ghana cedis</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Community Market</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-100 sm:text-base">Browse items and services offered by community sellers. Contact the seller directly on WhatsApp—FindIt does not handle payment or delivery.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/community-market/new" className="rounded-xl bg-gold-500 px-5 py-3 text-sm font-extrabold text-navy-950 hover:bg-gold-400">Post an item or service</Link>
          <a href={GROUP_URL} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Open WhatsApp group ↗</a>
        </div>
      </header>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"><strong>Public link:</strong> anyone who gets this page link can browse it. Approved listings show the seller&apos;s WhatsApp number.</p>
        <p className="rounded-xl border border-navy-200 bg-navy-50 p-4 text-sm leading-relaxed text-navy-800 dark:border-navy-700 dark:bg-navy-900/50 dark:text-navy-200"><strong>Buy safely:</strong> listings are submitted by sellers and are not independently verified. Inspect the item, agree payment and delivery directly, and don&apos;t send money to strangers before you&apos;re comfortable.</p>
      </div>

      <section className="mt-8" aria-label="Community listings">
        <CommunityMarketBrowser listings={listings} />
      </section>
    </main>
  );
}
