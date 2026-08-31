import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { getGuide, getGuides, getProduct, getOffersForProduct, getVendors } from "@/lib/data";
import { ProductCard } from "@/components/shared";
import { VendorTable } from "@/components/vendor-table";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getGuides()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.seoTitle,
    description: guide.metaDescription,
    openGraph: { title: guide.seoTitle, description: guide.metaDescription, type: "article" },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const vendors = getVendors();
  // First related product gets the live comparison table embedded
  const firstProduct = guide.relatedProductSlugs.map(getProduct).find(Boolean);
  const related = guide.relatedProductSlugs
    .map(getProduct)
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const others = (await getGuides()).filter((g) => g.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.seoTitle,
    description: guide.metaDescription,
    dateModified: guide.updatedAt,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/guides" className="hover:text-navy-700">Guides</Link> <span aria-hidden="true">›</span>{" "}
        <span className="text-navy-900 dark:text-navy-100">{guide.title}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-2xl font-extrabold leading-tight text-navy-900 dark:text-navy-100 md:text-3xl">{guide.title}</h1>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-soft dark:text-navy-300">
          <Clock className="h-3.5 w-3.5 text-gold-600 dark:text-gold-500" /> Updated {new Date(guide.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {guide.readMinutes} min read
        </p>
      </header>

      {/* body — markdown-lite: "## " lines become h2 sections */}
      <div className="prose-simple mt-6 space-y-4 text-[15px] leading-relaxed text-ink">
        {guide.body.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            return <h2 key={i} className="pt-4 text-xl font-extrabold text-navy-900 dark:text-navy-100">{line.replace("## ", "")}</h2>;
          }
          if (line.trim() === "") return null;
          return <p key={i} className="text-slate-soft dark:text-navy-300">{line}</p>;
        })}
      </div>

      {/* live comparison table inside the article (COMP-08 reuse) */}
      {firstProduct && (
        <section className="mt-8 rounded-2xl border border-navy-100 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-900/50 p-4 md:p-6">
          <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Live prices: {firstProduct.name}</h2>
          <p className="mb-4 mt-1 text-xs text-slate-soft dark:text-navy-300">
            Prices in this guide were checked on {guide.updatedAt} — the table below is live from today&apos;s data.
          </p>
          <div className="bg-white dark:bg-navy-900 rounded-xl">
            <VendorTable offers={getOffersForProduct(firstProduct.slug)} vendors={vendors} productSlug={firstProduct.slug} />
          </div>
        </section>
      )}

      {/* related product cards */}
      {related.length > 1 && (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Products mentioned in this guide</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} cheapest={getOffersForProduct(p.slug)[0]} />
            ))}
          </div>
        </section>
      )}

      {/* more guides */}
      <section className="mt-10 border-t border-navy-100 dark:border-navy-800 pt-6">
        <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Keep reading</h2>
        <ul className="mt-3 space-y-2">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={`/guides/${g.slug}`} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 dark:text-navy-300 hover:text-gold-700">
                {g.title} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
