import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getGuides } from "@/lib/data";

export const metadata: Metadata = {
  title: "Price Guides for Ghanaian Shoppers",
  description: "Buying guides, scam warnings and price comparisons for Ghanaian shoppers — updated as prices change.",
};

export default async function GuidesPage() {
  const guides = await getGuides();
  const [featured, ...rest] = guides;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">Price guides for Ghanaian shoppers</h1>
        <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">Buying advice, scam warnings and price comparisons — updated as prices change.</p>
      </header>

      {featured && (
        <Link href={`/guides/${featured.slug}`} className="hover-lift group mt-8 block overflow-hidden rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 md:grid md:grid-cols-[280px_1fr]">
          <div className="flex min-h-40 items-center justify-center" style={{ background: featured.gradient }}>
            <BookOpen className="h-12 w-12 text-white/80" strokeWidth={1.4} aria-hidden="true" />
          </div>
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">Featured guide</p>
            <h2 className="mt-1 text-xl font-extrabold text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">{featured.title}</h2>
            <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">{featured.excerpt}</p>
            <p className="mt-3 text-xs text-slate-400">Updated {new Date(featured.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {featured.readMinutes} min read</p>
          </div>
        </Link>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {rest.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="hover-lift group overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
            <div className="flex h-24 items-center justify-center" style={{ background: g.gradient }}>
              <BookOpen className="h-9 w-9 text-white/80" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="p-4">
              <h2 className="font-bold text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">{g.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-soft dark:text-navy-300">{g.excerpt}</p>
              <p className="mt-2 text-xs text-slate-400">Updated {new Date(g.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {g.readMinutes} min read</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
