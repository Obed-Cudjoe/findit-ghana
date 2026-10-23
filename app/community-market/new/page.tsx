import type { Metadata } from "next";
import Link from "next/link";
import { CommunityMarketForm } from "@/components/community-market-form";

export const metadata: Metadata = {
  title: "Post a community listing — FindIt Ghana",
  robots: { index: false, follow: false },
};

export default function NewCommunityListingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/community-market" className="text-sm font-semibold text-navy-800 underline dark:text-navy-200">← Community Market</Link>
      <header className="mt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">Community Market</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">Post an item or service</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-soft dark:text-navy-300">Submissions go to an admin for review before appearing publicly. Posting is free for this initial version. FindIt Ghana does not take payment or commission on community sales.</p>
      </header>
      <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900 sm:p-7">
        <CommunityMarketForm />
      </section>
    </main>
  );
}
