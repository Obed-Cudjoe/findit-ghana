import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Clock, TriangleAlert, MessageCircle, BadgeCheck, Infinity as InfinityIcon } from "lucide-react";
import {
  getMergedProductPage, getOffersForProduct, getSnapshotsForOffer, loadSnapshotsForOffer, getProducts,
  listingDaysSinceConfirm, vendorTrustScore, isListingFeatured, RECONFIRM_NUDGE_DAYS,
} from "@/lib/data";
import { ProductVisual, PriceChart, ProductCard, PriceDropBadge } from "@/components/shared";
import { ImageGallery } from "@/components/image-gallery";
import { VendorTable } from "@/components/vendor-table";
import {
  ProductActionRow,
  VendorTrustSignals,
  BeforeYouPayCard,
} from "@/components/product-actions";
import { readReports } from "@/lib/store";
import { PriceAlertForm } from "@/components/price-alert-form";
import { formatGHS, timeAgo, formatDate } from "@/lib/utils";
import { UNLIMITED_BADGE } from "@/lib/plans";

interface Props {
  params: Promise<{ slug: string }>;
}

// Catalogue pages MUST pre-render at build time (force-static) — without
// this, Vercel serves cached 404s for every product page. Vendor-listed
// products still render on demand via dynamicParams.
export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getMergedProductPage(slug);
  if (!found) return { title: "Product not found" };
  const { product, offers } = found;
  const cheapest = offers[0];
  const title = cheapest
    ? `${product.name} Price in Ghana — from ${formatGHS(cheapest.priceGhs)}`
    : `${product.name} — Prices in Ghana`;
  const description = `Compare ${product.name} prices in cedis from named vendors in Ghana. Stock, delivery times and fees shown upfront. Prices checked daily.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getMergedProductPage(slug);
  if (!found) notFound();

  const { product, offers, vendors, listing: vListing, listings, isCatalogue } = found;
  const cheapest = offers[0];
  const chartPoints = isCatalogue && cheapest
    ? (await loadSnapshotsForOffer(cheapest.id)).map((s) => ({ priceGhs: s.priceGhs, capturedAt: s.capturedAt }))
    : [];
  const similar = getProducts().filter((p) => p.category === product.category && p.slug !== slug).slice(0, 3);
  const listingOnly = !isCatalogue;

  // Trust signals: honest report history for THIS product. Reports match by
  // the listing URL containing the product slug. Read whenever a vendor
  // listing is involved — including merged pages where a listing matches a
  // catalogue product (isCatalogue true but a canonical listing exists).
  const allReports = vListing ? await readReports() : [];
  const reportStats = vListing
    ? (() => {
        const related = allReports.filter(
          (r) => r.listingUrl && r.listingUrl.toLowerCase().includes(slug.toLowerCase()),
        );
        const unresolved = related.filter((r) => r.status === "new" || r.status === "checking").length;
        return { total: related.length, unresolved };
      })()
    : { total: 0, unresolved: 0 };

  // Freshness + trust score for vendor listings (honest-data features).
  const daysConfirmed = vListing ? listingDaysSinceConfirm(vListing) : 0;
  const trustVendor = vListing
    ? vendors.find((v) => v.id === (vListing.vendorId ? `vp-${vListing.vendorId}` : `vlv-${vListing.id}`))
    : undefined;
  const trustScore = vListing
    ? vendorTrustScore({
        verified: trustVendor?.verified ?? false,
        hasSocial: Boolean(vListing.websiteUrl),
        unresolvedReports: reportStats.unresolved,
        daysSinceConfirm: daysConfirmed,
        hasPaidPlacement: Boolean(product.featured || product.unlimited || isListingFeatured(vListing)),
      })
    : 0;

  // Every photo the vendors on this page uploaded, in order. When several
  // shops list the same product, buyers see photos from all of them.
  const galleryImages = [
    ...new Set(
      listings
        .flatMap((l) => l.imageUrls ?? [])
        .filter((u) => typeof u === "string" && u.length > 0),
    ),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: galleryImages.length > 0 ? galleryImages : undefined,
    brand: { "@type": "Brand", name: listingOnly && vListing ? vListing.businessName : product.brand },
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
        {galleryImages.length > 0 ? (
          <ImageGallery images={galleryImages} name={product.name} className="w-full" />
        ) : (
          <ProductVisual product={product} className="aspect-square w-full rounded-2xl shadow-md" />
        )}
        <div>
          {listingOnly && vListing ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <BadgeCheck className="h-3.5 w-3.5" />{" "}
              {listings.length > 1
                ? `${listings.length} independent vendors · first listed ${formatDate(vListing.createdAt)}`
                : `Self-listed by ${vListing.businessName} · added ${formatDate(vListing.createdAt)}`}
            </p>
          ) : (
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-700">{product.brand}</p>
          )}
          <h1 className="mt-1 break-words text-2xl font-extrabold text-navy-900 md:text-3xl">{product.name}</h1>
          {product.unlimited && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-950 px-3 py-1 text-xs font-extrabold text-gold-400 ring-1 ring-gold-500/60">
              <InfinityIcon className="h-3.5 w-3.5" /> {UNLIMITED_BADGE} vendor
            </p>
          )}
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Clock className="h-3.5 w-3.5" /> Prices checked {timeAgo(listingOnly && vListing ? (vListing.updatedAt ?? vListing.createdAt) : product.updatedAt)}
          </p>

          {/* Social presence + report history + trust score (honest-data features) */}
          {vListing && (
            <div className="mt-3 space-y-2">
              <VendorTrustSignals socialUrl={vListing.websiteUrl ?? ""} reports={reportStats} />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-bold text-white"
                  title="Computed from verification, social presence, report history, freshness and plan"
                >
                  <ShieldCheck className={`h-3.5 w-3.5 ${trustScore >= 4 ? "text-emerald-400" : trustScore >= 3 ? "text-gold-400" : "text-amber-400"}`} />
                  Trust score {trustScore}/5
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    daysConfirmed > RECONFIRM_NUDGE_DAYS
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {daysConfirmed <= RECONFIRM_NUDGE_DAYS
                    ? `Vendor confirmed ${daysConfirmed === 0 ? "today" : `${daysConfirmed} day${daysConfirmed === 1 ? "" : "s"} ago`}`
                    : `Not re-confirmed in ${daysConfirmed} days — ask the vendor if it's still available`}
                </span>
              </div>
            </div>
          )}

          {listingOnly && vListing ? (
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
                  <p className="text-[11px] uppercase tracking-wide text-slate-soft">Vendors</p>
                  <p className="text-sm font-semibold text-navy-900">{offers.length} live offer{offers.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-soft">
                <MessageCircle className="h-4 w-4 text-emerald-600" /> The button opens WhatsApp straight to this vendor — the sale happens between you and them, never on FindIt Ghana.
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
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                      Price history <span className="text-xs font-normal text-slate-soft">(best offer)</span>
                    </p>
                    <PriceDropBadge points={chartPoints} />
                  </div>
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

      {/* Price-drop alert — every product page. Subscribes the shopper's
          WhatsApp number; the daily refresh triggers it on a real drop. */}
      <div className="mt-6">
        <PriceAlertForm
          productSlug={slug}
          productName={product.name}
          currentPrice={cheapest?.priceGhs}
        />
      </div>

      {/* Before-you-pay checklist — every product page (both catalogue + vendor) */}
      <BeforeYouPayCard />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <ProductActionRow
          productName={product.name}
          priceGhs={cheapest?.priceGhs ?? 0}
          slug={slug}
          socialUrl={vListing?.websiteUrl || undefined}
        />
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} cheapest={getOffersForProduct(p.slug)[0]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
