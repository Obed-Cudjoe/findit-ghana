import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Clock, TriangleAlert, MessageCircle, BadgeCheck } from "lucide-react";
import {
  getAnyProduct, getOffersForProduct, getVendors, getSnapshotsForOffer, getProducts,
  listingToOffer, listingToVendor,
} from "@/lib/data";
import type { VendorListing } from "@/lib/types";
import { ProductVisual, PriceChart, ProductCard } from "@/components/shared";
import { VendorTable } from "@/components/vendor-table";
import { formatGHS, timeAgo, formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

// Seed products pre-render at build time; vendor-listed products render on demand.
export const revalidate = 3600;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getAnyProduct(slug);
  if (!found) return { title: "Product not found" };
  const { product, listing } = found;
  const cheapest = listing ? listingToOffer(listing as VendorListing) : getOffersForProduct(slug)[0];
  const title = cheapest
    ? `${product.name} Price in Ghana — from ${formatGHS(cheapest.priceGhs)}`
    : `${product.name} — Prices in Ghana`;
  const description = `Compare ${product.name} prices in cedis from named vendors in Ghana. Stock, delivery times and fees shown upfront. Prices checked daily.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getAnyProduct(slug);
  if (!found) notFound();

  const { product, listing } = found;
  const vListing = listing as VendorListing | undefined;

  // vendor-listing path: one offer, one pseudo-vendor, WhatsApp buy link
  const offers = vListing ? [listingToOffer(vListing)] : getOffersForProduct(slug);
  const vendors = vListing ? [...getVendors(), listingToVendor(vListing)] : getVendors();
  const cheapest = offers[0];
  const chartPoints = !vListing && cheapest
    ? getSnapshotsForOffer(cheapest.id).map((s) => ({ priceGhs: s.priceGhs, capturedAt: s.capturedAt }))
    : [];
  const similar = getProducts().filter((p) => p.category === product.category && p.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: vListing ? vListing.businessName : product.brand },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GHS",
      lowPrice: cheapest ? cheapest.priceGhs : undefined,
      highPrice: offers.length ? offers[offers.length - 1].priceGhs : undefined,
      offerCount: offers.length,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="break-words text-sm text-slate-soft">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/category/${product.category}`} className="hover:text-navy-700 capitalize">{product.category.replace("-", " & ")}</Link>{" "}
        <span aria-hidden="true">›</span> <span className="text-navy-900">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[320px_1fr]">
        <ProductVisual product={product} className="aspect-square w-full rounded-2xl shadow-md" />
        <div>
          {vListing ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <BadgeCheck className="h-3.5 w-3.5" /> Self-listed by {vListing.businessName} · added {formatDate(vListing.createdAt)}
            </p>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-700">{product.brand}</p>
          )}
          <h1 className="mt-1 break-words text-2xl font-extrabold text-navy-900 md:text-3xl">{product.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Clock className="h-3.5 w-3.5" /> Prices checked {timeAgo(vListing ? vListing.createdAt : product.updatedAt)}
          </p>

          {vListing ? (
            /* vendor listing: description + contact instead of specs */
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-slate-soft">{vListing.description}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg bg-navy-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-soft">Category</p>
                  <p className="text-sm font-semibold text-navy-900 capitalize">{vListing.category.replace("-", " & ")}</p>
                </div>
                <div className="rounded-lg bg-navy-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-soft">Stock</p>
                  <p className="text-sm font-semibold text-navy-900">{vListing.stockCount ?? "Ask vendor"}</p>
                </div>
                <div className="rounded-lg bg-navy-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-soft">Contact</p>
                  <p className="text-sm font-semibold text-navy-900">+{vListing.phone}</p>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-soft">
                <MessageCircle className="h-4 w-4 text-emerald-600" /> The buy button opens WhatsApp straight to this vendor — no middleman.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-navy-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-soft">{k}</p>
                    <p className="text-sm font-semibold text-navy-900">{v}</p>
                  </div>
                ))}
              </div>
              {chartPoints.length > 1 && (
                <div className="mt-5 rounded-xl border border-navy-100 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                    Price history <span className="text-xs font-normal text-slate-soft">(best offer)</span>
                  </p>
                  <PriceChart points={chartPoints} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-navy-900">Vendor comparison — {offers.length} live offer{offers.length === 1 ? "" : "s"}</h2>
          <p className="text-xs text-slate-soft">Sorted by total cost (price + delivery fee).</p>
        </div>
        <VendorTable offers={offers} vendors={vendors} productSlug={product.slug} />

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-xs text-slate-soft">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Only named vendors are listed — never anonymous sellers.</span>
          <span className="inline-flex items-center gap-1.5"><TriangleAlert className="h-4 w-4 text-amber-600" /> Total cost includes delivery, so nothing surprises you at the door.</span>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href={`/report/price?listing=${encodeURIComponent(`https://findit-ghana.vercel.app/product/${slug}`)}`} className="rounded-lg border border-navy-200 px-4 py-2 text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors">
          Report a price error
        </Link>
        <Link href="/report/suspicious" className="rounded-lg border border-navy-200 px-4 py-2 text-navy-700 hover:border-gold-500 hover:text-gold-700 transition-colors">
          Report a suspicious listing
        </Link>
      </div>

      {similar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-extrabold text-navy-900">Shoppers also compared</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} cheapest={getOffersForProduct(p.slug)[0]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
