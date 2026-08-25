import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-700">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy-900">This page moved, or never existed</h1>
      <p className="mt-3 max-w-md text-sm text-slate-soft">
        Products get replaced and links go stale — but the honest price is still one search away.
      </p>

      <form action="/search" method="get" role="search" className="mt-8 w-full max-w-md">
        <label htmlFor="nf-q" className="sr-only">Search</label>
        <div className="flex overflow-hidden rounded-xl border border-navy-200 bg-white focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/30">
          <span className="flex items-center pl-3 text-slate-soft" aria-hidden="true"><Search className="h-4 w-4" /></span>
          <input id="nf-q" name="q" type="search" placeholder="Search prices in Ghana…" className="min-w-0 flex-1 px-3 py-3 text-base focus:outline-none" />
          <button type="submit" className="shrink-0 bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800 transition-colors">Go</button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        {[
          ["/category/phones", "Phones"],
          ["/category/laptops", "Laptops"],
          ["/category/appliances", "Appliances"],
          ["/guides", "Price guides"],
          ["/how-it-works", "How it works"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-navy-200 px-4 py-1.5 text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
