import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Store } from "lucide-react";
import { getDirectoryVendors } from "@/lib/data";
import { VendorAvatar } from "@/components/vendor-avatar";
import { UNLIMITED_BADGE, VENDOR_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Vendors in Ghana — Named Shops",
  description: "Browse named vendors on FindIt Ghana — official retailers and independent shops with live cedis prices.",
};

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await getDirectoryVendors();
  const official = vendors.filter((v) => v.source === "official");
  const marketplace = vendors.filter((v) => v.source === "marketplace");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700">Directory</p>
        <h1 className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">Named vendors in Ghana</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-soft">
          Every shop here is named. Official retailers sit next to independent vendors who list on FindIt Ghana — no anonymous sellers.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-navy-900">Official price sources</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {official.map((v) => (
            <VendorCard key={v.slug} vendor={v} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-extrabold text-navy-900">Independent shops</h2>
          <Link href="/for-vendors" className="text-sm font-semibold text-gold-700 hover:text-gold-600">
            List your shop →
          </Link>
        </div>
        {marketplace.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-navy-200 bg-navy-50/50 p-8 text-center text-sm text-slate-soft">
            No independent shops live yet.{" "}
            <Link href="/for-vendors" className="font-semibold text-navy-800 underline">Be the first to list a product</Link>.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketplace.map((v) => (
              <VendorCard key={v.slug} vendor={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Awaited<ReturnType<typeof getDirectoryVendors>>[number] }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="hover-lift group flex gap-4 rounded-xl border border-navy-100 bg-white p-4"
    >
      <VendorAvatar name={vendor.name} hue={vendor.logoHue} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-extrabold text-navy-900 group-hover:text-gold-700 transition-colors">
          {vendor.name}
          {vendor.verified && (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
          {vendor.unlimited ? (
            <span className="rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/60">
              {UNLIMITED_BADGE}
            </span>
          ) : (
            vendor.featured && (
              <span className="rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-extrabold text-navy-950">★ Pro</span>
            )
          )}
        </p>
        <p className="mt-0.5 text-xs text-slate-soft">
          {vendor.listingCount} listing{vendor.listingCount === 1 ? "" : "s"}
          {vendor.plan && vendor.source === "marketplace" ? ` · ${VENDOR_PLANS[vendor.plan].name}` : ""}
        </p>
        {vendor.blurb && <p className="mt-1 line-clamp-2 text-xs text-slate-soft">{vendor.blurb}</p>}
      </div>
      <Store className="h-4 w-4 shrink-0 text-navy-200 group-hover:text-gold-600" aria-hidden="true" />
    </Link>
  );
}
