import type { Metadata } from "next";
import { readCommunityMarketListings } from "@/lib/community-market";
import { AdminCommunityMarket } from "@/components/admin-community-market";

export const metadata: Metadata = { title: "Community Market Review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminCommunityMarketPage() {
  const listings = await readCommunityMarketListings({ includeHidden: true });
  const pending = listings.filter((item) => item.status === "pending").length;
  const approved = listings.filter((item) => item.status === "approved").length;
  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-navy-900 px-3 py-1 font-bold text-white">{listings.length} total</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">{pending} pending</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">{approved} live</span>
      </div>
      <p className="mb-4 text-sm text-slate-soft dark:text-navy-300">These are community classifieds, separate from FindIt&apos;s curated shop prices. Check descriptions and contact details before approving; seller claims are not automatically verified.</p>
      {listings.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy-200 bg-navy-50 p-8 text-center text-sm text-slate-soft dark:border-navy-700 dark:bg-navy-900/50">No community listings have been submitted yet.</p>
      ) : <AdminCommunityMarket initialListings={listings} />}
    </section>
  );
}
