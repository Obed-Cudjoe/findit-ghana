import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowRight } from "lucide-react";
import { getCategory, getCategories, categoryResultsAll } from "@/lib/data";
import { ProductCard, EmptyState } from "@/components/shared";

interface Props {
  params: Promise<{ slug: string }>;
}

// Category pages MUST pre-render at build time — same 404-risk as products
// without force-static on Vercel.
export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  const title = `${category.name} Prices in Ghana — Live Vendor Comparison`;
  const description = `${category.blurb} Compare prices in cedis, stock levels and delivery costs. Checked daily.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const results = await categoryResultsAll(slug);
  const others = getCategories().filter((c) => c.slug !== slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900">{category.name}</span>
      </nav>

      <header className="mt-4">
        <h1 className="break-words text-2xl font-extrabold text-navy-900 md:text-3xl">{category.name} in Ghana — live prices</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-soft">{category.blurb}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-soft">
          <Clock className="h-3.5 w-3.5 text-gold-600" /> Prices checked within the last 24 hours · delivery fees shown per vendor
        </p>
      </header>

      {/* sibling categories */}
      <nav aria-label="Other categories" className="mt-5 flex flex-wrap gap-2 text-sm">
        {others.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-full border border-navy-200 px-3 py-1.5 text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors">
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {results.length === 0 ? (
          <EmptyState title={`No live offers in ${category.name} yet`} hint="We add new products with every daily refresh — check back soon, or search for something else." />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {results.map(({ product, cheapest }) => (
              <ProductCard key={product.id} product={product} cheapest={cheapest} />
            ))}
          </div>
        )}
      </div>

      <Link href="/guides" className="mt-10 flex items-center justify-between gap-4 rounded-xl bg-navy-900 px-4 py-4 text-white hover:bg-navy-800 transition-colors sm:px-6">
        <span>
          <span className="block font-bold">Not sure what to buy?</span>
          <span className="block text-sm text-navy-100">Read our price guides — written around real vendor prices.</span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-gold-500" />
      </Link>
    </div>
  );
}
