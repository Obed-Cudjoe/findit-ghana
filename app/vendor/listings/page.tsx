import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLoggedInVendor } from "@/lib/vendor-auth";
import { readVendorListings, listingsForVendor, countActiveListingsForVendor } from "@/lib/store";
import { listingLimitFor, listingLimitLabel, nextPlanAfter, VENDOR_PLANS } from "@/lib/plans";
import { VendorDashNav } from "@/components/vendor-dash-nav";
import { VendorProductForm } from "@/components/vendor-product-form";
import { VendorListingsTable } from "@/components/vendor-listings-table";

export const metadata: Metadata = { title: "Your listings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VendorListingsPage() {
  const vendor = await getLoggedInVendor();
  if (!vendor) redirect("/vendor/login");

  const listings = await readVendorListings();
  const mine = listingsForVendor(listings, vendor);
  const used = countActiveListingsForVendor(listings, vendor);
  const cap = listingLimitFor(vendor);
  const atCap = used >= cap;
  const next = nextPlanAfter(vendor);
  const nextPlan = next ? VENDOR_PLANS[next] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <VendorDashNav businessName={vendor.businessName} active="listings" />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-navy-900 px-3 py-1 font-bold text-white">{used} / {listingLimitLabel(cap)} used</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:text-emerald-200">{mine.filter((l) => l.status === "approved").length} live</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:text-amber-200">{mine.filter((l) => l.status === "pending").length} in review</span>
      </div>

      {mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
          No listings yet. Add your first product below.
        </p>
      ) : (
        <VendorListingsTable listings={mine} />
      )}

      <section className="mt-8 rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">Add a listing</h2>
        <p className="mb-5 mt-1 text-sm text-slate-soft dark:text-navy-300">
          Uses your current plan cap ({listingLimitLabel(cap)}). New products go to review before they appear in search.
        </p>
        {atCap ? (
          <div className="rounded-xl border border-gold-600/40 bg-gold-500/10 p-5">
            <p className="font-bold text-navy-900 dark:text-navy-100">You&apos;ve used all {listingLimitLabel(cap)} listing{cap === 1 ? "" : "s"} on this plan.</p>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">
              {nextPlan
                ? <>Upgrade to {nextPlan.name} (GH₵{nextPlan.priceGhs}/mo) on For vendors, pay via MoMo, and we unlock the extra slots.</>
                : <>You are on the top plan — contact us if you still cannot add listings.</>}
            </p>
            <Link href="/for-vendors" className="mt-3 inline-block text-sm font-bold text-navy-900 dark:text-navy-100 underline">
              Upgrade on For vendors →
            </Link>
          </div>
        ) : (
          <VendorProductForm />
        )}
      </section>
    </div>
  );
}
