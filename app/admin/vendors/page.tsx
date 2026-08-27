import type { Metadata } from "next";
import { readVendorProfiles, readVendorListings, readClicks, countActiveListingsForVendor } from "@/lib/store";
import { listingLimitFor, listingLimitLabel, phoneKey } from "@/lib/plans";
import { VendorsTable } from "./vendors-table";

export const metadata: Metadata = { title: "Vendors", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const [profiles, listings, clicks] = await Promise.all([
    readVendorProfiles(),
    readVendorListings(),
    readClicks(1000),
  ]);

  const rows = profiles.map((p) => {
    const theirs = listings.filter((l) => l.vendorId === p.id || phoneKey(l.phone) === phoneKey(p.phone));
    const name = p.businessName.toLowerCase();
    const vendorClicks = clicks.filter(
      (c) => c.vendorName.toLowerCase() === name && !c.productSlug.startsWith("vendor-view:"),
    );
    const vendorViews = clicks.filter(
      (c) => c.productSlug === `vendor-view:${p.slug}` || (c.destinationUrl.includes(`/vendors/${p.slug}`) && c.productSlug.startsWith("vendor-view:")),
    );
    return {
      id: p.id,
      businessName: p.businessName,
      slug: p.slug,
      contactName: p.contactName,
      phone: p.phone,
      email: p.email,
      plan: p.plan,
      planExpiresAt: p.planExpiresAt,
      paymentStatus: p.paymentStatus,
      verified: p.verified,
      status: p.status,
      listingTotal: theirs.length,
      listingApproved: theirs.filter((l) => l.status === "approved").length,
      listingPending: theirs.filter((l) => l.status === "pending").length,
      listingLimit: listingLimitFor(p),
      listingLimitLabel: listingLimitLabel(listingLimitFor(p)),
      clicks: vendorClicks.length,
      views: vendorViews.length,
      createdAt: p.createdAt,
    };
  });

  const pendingPay = profiles.filter((p) => p.paymentStatus === "pending").length;
  const live = profiles.filter((p) => p.status === "approved").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-navy-900 px-3 py-1 font-bold text-white">{profiles.length} shops</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{live} approved</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">{pendingPay} awaiting MoMo</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{listings.length} listings linked</span>
      </div>

      {profiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50/50 p-8 text-center text-sm text-slate-soft">
          No vendor shops yet — they appear here when someone submits the form on /for-vendors.
        </p>
      ) : (
        <VendorsTable vendors={rows} />
      )}

    </div>
  );
}
