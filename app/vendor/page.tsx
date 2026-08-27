import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MousePointerClick, Store, Star } from "lucide-react";
import { getLoggedInVendor } from "@/lib/vendor-auth";
import { readClicks, readVendorListings, listingsForVendor, countActiveListingsForVendor } from "@/lib/store";
import { effectivePlan, listingLimitFor, listingLimitLabel, planHasStats, UNLIMITED_BADGE, VENDOR_PLANS, MOMO_NUMBER, MOMO_NAME, MOMO_WHATSAPP } from "@/lib/plans";
import { VendorDashNav } from "@/components/vendor-dash-nav";

export const metadata: Metadata = { title: "Shop dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

function expiryLabel(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const days = Math.ceil((t - Date.now()) / 86_400_000);
  const pretty = new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (days < 0) return `expired ${pretty}`;
  return `${pretty} (${days} day${days === 1 ? "" : "s"} left)`;
}

export default async function VendorDashboardPage() {
  const vendor = await getLoggedInVendor();
  if (!vendor) redirect("/vendor/login");

  const [listings, clicks] = await Promise.all([readVendorListings(), readClicks(1000)]);
  const mine = listingsForVendor(listings, vendor);
  const used = countActiveListingsForVendor(listings, vendor);
  const cap = listingLimitFor(vendor);
  const live = mine.filter((l) => l.status === "approved").length;
  const pending = mine.filter((l) => l.status === "pending").length;
  const plan = effectivePlan(vendor);
  const showStats = planHasStats(vendor);
  const name = vendor.businessName.toLowerCase();
  const outbound = clicks.filter(
    (c) => c.vendorName.toLowerCase() === name && !c.productSlug.startsWith("vendor-view:"),
  ).length;
  const views = clicks.filter(
    (c) => c.productSlug === `vendor-view:${vendor.slug}` || c.destinationUrl.includes(`/vendors/${vendor.slug}`),
  ).length;

  const ref = `FINDIT-${vendor.slug.toUpperCase().slice(0, 18)}`;
  const waText = encodeURIComponent(`Hi, I want to activate ${VENDOR_PLANS[vendor.plan].name} on FindIt Ghana. MoMo reference: ${ref}. Business: ${vendor.businessName}.`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <VendorDashNav businessName={vendor.businessName} active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft">Plan</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xl font-extrabold text-navy-900">
            {VENDOR_PLANS[plan].name}
            {plan === "unlimited" && (
              <span className="rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/60">
                {UNLIMITED_BADGE}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-soft">
            {plan === "free"
              ? vendor.paymentStatus === "pending"
                ? `Awaiting MoMo for ${VENDOR_PLANS[vendor.plan].name}`
                : "Free shop"
              : expiryLabel(vendor.planExpiresAt)}
          </p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft">Listings</p>
          <p className="mt-1 text-xl font-extrabold text-navy-900">{used} / {listingLimitLabel(cap)}</p>
          <p className="mt-1 text-xs text-slate-soft">{live} live · {pending} in review</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft">Shop status</p>
          <p className="mt-1 text-xl font-extrabold capitalize text-navy-900">{vendor.status}</p>
          <p className="mt-1 text-xs text-slate-soft">{vendor.verified ? "Verified badge on" : "Not verified yet"}</p>
        </div>
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft">Public shop</p>
          <Link href={`/vendors/${vendor.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-navy-900 underline hover:text-gold-700">
            <Store className="h-4 w-4 text-gold-600" /> /vendors/{vendor.slug}
          </Link>
          <p className="mt-1 text-xs text-slate-soft">Live after we approve the shop.</p>
        </div>
      </div>

      {vendor.paymentStatus === "pending" && vendor.plan !== "free" && (
        <div className="mt-6 rounded-xl border border-gold-600/40 bg-gold-500/10 p-5">
          <p className="font-extrabold text-navy-900">Finish MoMo to activate {VENDOR_PLANS[vendor.plan].name}</p>
          <p className="mt-1 text-sm text-slate-soft">
            Send <strong className="text-navy-900">GH₵{VENDOR_PLANS[vendor.plan].priceGhs}</strong> to{" "}
            <strong className="text-navy-900">{MOMO_NUMBER}</strong> ({MOMO_NAME}) with reference{" "}
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold">{ref}</span>. Until we confirm, you still have Free limits (1 listing).
          </p>
          <a
            href={`https://wa.me/${MOMO_WHATSAPP}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400"
          >
            WhatsApp {MOMO_NUMBER} with my reference
          </a>
        </div>
      )}

      {showStats ? (
        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-navy-900">
            <MousePointerClick className="h-5 w-5 text-gold-600" /> Shop stats
          </h2>
          <p className="mt-1 text-sm text-slate-soft">Pro plan — views on your public shop and outbound Buy / WhatsApp clicks.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-3xl font-extrabold text-navy-900">{views}</p>
              <p className="text-sm text-slate-soft">Shop views</p>
            </div>
            <div className="rounded-lg bg-navy-50 p-4">
              <p className="text-3xl font-extrabold text-navy-900">{outbound}</p>
              <p className="text-sm text-slate-soft">Outbound clicks</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-xl border border-dashed border-navy-200 bg-navy-50/60 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-navy-900">
            <Star className="h-5 w-5 text-gold-600" /> Stats are on Pro
          </h2>
          <p className="mt-1 text-sm text-slate-soft">
            Upgrade to Pro (GH₵{VENDOR_PLANS.pro.priceGhs}/mo) for shop views, outbound clicks, {VENDOR_PLANS.pro.listingLimit} listings, and a homepage featured shop — or go {UNLIMITED_BADGE} (GH₵{VENDOR_PLANS.unlimited.priceGhs}/mo) for unlimited listings and top ranking.
          </p>
          <Link href="/for-vendors" className="mt-3 inline-block text-sm font-bold text-navy-900 underline">
            See plans on For vendors →
          </Link>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/vendor/listings" className="inline-flex items-center justify-center rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400">
          Manage listings
        </Link>
        <Link href="/for-vendors" className="inline-flex items-center justify-center rounded-xl border border-navy-200 px-5 py-3 text-sm font-bold text-navy-900 hover:border-gold-400">
          Change plan
        </Link>
      </div>
    </div>
  );
}
