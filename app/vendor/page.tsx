import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MousePointerClick, Store, Star } from "lucide-react";
import { getLoggedInVendor } from "@/lib/vendor-auth";
import { readClicks, readVendorListings, listingsForVendor, countActiveListingsForVendor } from "@/lib/store";
import { effectivePlan, listingLimitFor, listingLimitLabel, planHasStats, VENDOR_PLANS } from "@/lib/plans";
import { PaystackCheckoutButton } from "@/components/paystack-checkout-button";
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <VendorDashNav businessName={vendor.businessName} active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Plan</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xl font-extrabold text-navy-900 dark:text-navy-100">
            {VENDOR_PLANS[plan].name}
          </p>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">
            {plan === "free"
              ? vendor.paymentStatus === "pending"
                ? `Awaiting Paystack payment for ${VENDOR_PLANS[vendor.plan].name}`
                : "Free shop"
              : expiryLabel(vendor.planExpiresAt)}
          </p>
        </div>
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Listings</p>
          <p className="mt-1 text-xl font-extrabold text-navy-900 dark:text-navy-100">{used} / {listingLimitLabel(cap)}</p>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">{live} live · {pending} in review</p>
          {Number.isFinite(cap) && used > cap && (
            <p className="mt-2 rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Above your plan cap — your {used} listings stay live, but new ones are blocked until you&apos;re under {cap} or upgrade.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Shop status</p>
          <p className="mt-1 text-xl font-extrabold capitalize text-navy-900 dark:text-navy-100">{vendor.status}</p>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">{vendor.verified ? "Verified badge on" : "Not verified yet"}</p>
        </div>
        <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Public shop</p>
          <Link href={`/vendors/${vendor.slug}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-navy-900 dark:text-navy-100 underline hover:text-gold-700">
            <Store className="h-4 w-4 text-gold-600 dark:text-gold-500" /> /vendors/{vendor.slug}
          </Link>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">Live after we approve the shop.</p>
          <Link href={`/vendors/${vendor.slug}/card`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-gold-700 dark:text-gold-500 underline hover:text-gold-600">
            🎴 Your share card (QR code) →
          </Link>
          <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">Post it in your WhatsApp groups &amp; TikTok bio.</p>
        </div>
      </div>

      {vendor.paymentStatus === "pending" && vendor.plan !== "free" && (
        <div className="mt-6 rounded-xl border border-gold-600/40 bg-gold-500/10 p-5">
          <p className="font-extrabold text-navy-900 dark:text-navy-100">Complete payment to activate {VENDOR_PLANS[vendor.plan].name}</p>
          <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">
            Your account remains on Free limits ({VENDOR_PLANS.free.listingLimit} listings) until Paystack confirms payment of GH₵{VENDOR_PLANS[vendor.plan].priceGhs}.
          </p>
          <PaystackCheckoutButton vendorSlug={vendor.slug} label={`Pay GH₵${VENDOR_PLANS[vendor.plan].priceGhs} with Paystack`} />
        </div>
      )}

      {showStats ? (
        <section className="mt-6 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-navy-900 dark:text-navy-100">
            <MousePointerClick className="h-5 w-5 text-gold-600 dark:text-gold-500" /> Shop stats
          </h2>
          <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Your plan includes public shop views and outbound Buy / WhatsApp click counts.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-navy-50 dark:bg-navy-900/60 p-4">
              <p className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">{views}</p>
              <p className="text-sm text-slate-soft dark:text-navy-300">Shop views</p>
            </div>
            <div className="rounded-lg bg-navy-50 dark:bg-navy-900/60 p-4">
              <p className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">{outbound}</p>
              <p className="text-sm text-slate-soft dark:text-navy-300">Outbound clicks</p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/60 dark:bg-navy-900/50 p-5">
          <h2 className="flex items-center gap-2 font-extrabold text-navy-900 dark:text-navy-100">
            <Star className="h-5 w-5 text-gold-600 dark:text-gold-500" /> Stats are on Pro and Growth
          </h2>
          <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">
            Pro is GH₵{VENDOR_PLANS.pro.priceGhs}/month for up to {VENDOR_PLANS.pro.listingLimit} listings, shop views and outbound clicks. Growth is GH₵{VENDOR_PLANS.unlimited.priceGhs}/month for up to {VENDOR_PLANS.unlimited.listingLimit} listings with the same shop tools. Featured placement is labelled; paid plans do not guarantee sales.
          </p>
          <Link href="/for-vendors" className="mt-3 inline-block text-sm font-bold text-navy-900 dark:text-navy-100 underline">
            See plans on For vendors →
          </Link>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/vendor/listings" className="inline-flex items-center justify-center rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400">
          Manage listings
        </Link>
        <Link href="/for-vendors" className="inline-flex items-center justify-center rounded-xl border border-navy-200 dark:border-navy-700 px-5 py-3 text-sm font-bold text-navy-900 dark:text-navy-100 hover:border-gold-400">
          Change plan
        </Link>
        {vendor.plan !== "free" && vendor.paymentStatus === "confirmed" && (
          <PaystackCheckoutButton vendorSlug={vendor.slug} label={`Renew ${VENDOR_PLANS[vendor.plan].name} — GH₵${VENDOR_PLANS[vendor.plan].priceGhs}`} />
        )}
      </div>
    </div>
  );
}
