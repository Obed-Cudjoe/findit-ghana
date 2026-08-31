import type { Metadata } from "next";
import { readVendorListings } from "@/lib/store";
import { ListingsTable } from "./listings-table";

export const metadata: Metadata = { title: "Vendor Listings Review", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const listings = await readVendorListings();
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-navy-900 px-3 py-1 font-bold text-white">{listings.length} total</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:text-amber-200">{listings.filter((l) => l.status === "pending").length} pending review</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800 dark:text-emerald-200">{listings.filter((l) => l.status === "approved").length} live</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{listings.filter((l) => l.status === "rejected").length} rejected</span>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
          No vendor listings yet — they appear here the moment someone submits the form on /for-vendors.
        </p>
      ) : (
        <ListingsTable listings={listings} />
      )}
    </div>
  );
}
