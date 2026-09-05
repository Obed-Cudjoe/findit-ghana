import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, MousePointerClick } from "lucide-react";
import { getShopBySlug, getVendors, officialSources } from "@/lib/data";
import { VendorAvatar } from "@/components/vendor-avatar";
import ShopSearch from "@/components/shop-search";
import { ViewTracker } from "@/components/view-tracker";
import { readClicks } from "@/lib/store";
import { effectivePlan, UNLIMITED_BADGE, VENDOR_PLANS } from "@/lib/plans";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  const vendors = getVendors();
  return officialSources
    .map((s) => vendors.find((v) => v.name === s.name))
    .filter((v): v is NonNullable<typeof v> => !!v)
    .map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return { title: "Vendor not found" };
  return {
    title: `${shop.vendor.name} — Prices in Ghana`,
    description: `Live cedis prices from ${shop.vendor.name} on FindIt Ghana. ${shop.listingCount} listing${shop.listingCount === 1 ? "" : "s"}.`,
  };
}

export default async function VendorShopPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const { vendor, profile, products, listingCount, kind, showStats } = shop;
  const clicks = showStats ? await readClicks(1000) : [];
  const outbound = clicks.filter(
    (c) => c.vendorName.toLowerCase() === vendor.name.toLowerCase() && !c.productSlug.startsWith("vendor-view:"),
  ).length;
  const views = clicks.filter(
    (c) => c.productSlug === `vendor-view:${slug}` || c.destinationUrl.includes(`/vendors/${slug}`),
  ).length;

  const plan = profile ? effectivePlan(profile) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ViewTracker productSlug={`vendor-view:${slug}`} vendorName={vendor.name} destinationUrl={`/vendors/${slug}`} />

      <nav aria-label="Breadcrumb" className="text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <Link href="/vendors" className="hover:text-navy-700">Vendors</Link>{" "}
        <span aria-hidden="true">›</span> <span className="text-navy-900 dark:text-navy-100">{vendor.name}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-4">
        <VendorAvatar name={vendor.name} hue={vendor.logoHue} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-navy-900 dark:text-navy-100 md:text-3xl">
            {vendor.name}
            {vendor.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {plan === "unlimited" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-950 px-2.5 py-1 text-xs font-extrabold text-gold-400 ring-1 ring-gold-500/60">
                {UNLIMITED_BADGE}
              </span>
            ) : (
              plan && plan !== "free" && (
                <span className="rounded-full bg-gold-500 px-2.5 py-1 text-xs font-extrabold text-navy-950">
                  {VENDOR_PLANS[plan].name}
                </span>
              )
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">
            {listingCount} live listing{listingCount === 1 ? "" : "s"}
            {kind === "official" ? " · official price source" : " · independent shop on FindIt Ghana"}
          </p>
          {showStats && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy-50 dark:bg-navy-900/60 px-3 py-1 text-xs font-semibold text-navy-800 dark:text-navy-200">
              <MousePointerClick className="h-3.5 w-3.5 text-gold-600 dark:text-gold-500" />
              {views} shop view{views === 1 ? "" : "s"} · {outbound} outbound click{outbound === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </header>

      <p className="mt-4 text-xs text-slate-soft dark:text-navy-300">
        This is your shop?{" "}
        <Link href="/vendor/login" className="font-semibold text-navy-800 dark:text-navy-200 underline">Log in to the dashboard →</Link>
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Listings</h2>
        {products.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
            No live listings from this shop yet.
          </p>
        ) : (
          <ShopSearch products={products} vendorName={vendor.name} />
        )}
      </section>
    </div>
  );
}
