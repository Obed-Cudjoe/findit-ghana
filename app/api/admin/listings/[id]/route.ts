// Admin-only: approve / reject a vendor listing.
// Approval instantly revalidates search, category and product pages
// so the listing appears on the site immediately.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { updateVendorListingStatus, readVendorListings, setVendorListingFeatured, updateVendorProfile } from "@/lib/store";

const VALID = ["pending", "approved", "rejected"] as const;

// PATCH accepts either { status } (approve/reject) or { featuredUntil } (paid
// featured placement: ISO date string, or null to clear), or both.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string; featuredUntil?: string | null };

  if (body.featuredUntil !== undefined) {
    const until = body.featuredUntil;
    if (until !== null && (typeof until !== "string" || Number.isNaN(new Date(until).getTime()))) {
      return NextResponse.json({ error: "featuredUntil must be an ISO date or null." }, { status: 400 });
    }
    const ok = await setVendorListingFeatured(id, until);
    if (!ok) return NextResponse.json({ error: "Listing not found or store unavailable." }, { status: 404 });
    return NextResponse.json({ ok: true, featuredUntil: until });
  }

  const status = body.status;
  if (!status || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await updateVendorListingStatus(id, status as (typeof VALID)[number]);
  if (!ok) return NextResponse.json({ error: "Listing not found or store unavailable." }, { status: 404 });

  // invalidate caches so the listing's new state is visible everywhere
  try {
    const listings = await readVendorListings();
    const listing = listings.find((l) => l.id === id);
    if (listing) {
      revalidatePath("/search");
      revalidatePath(`/category/${listing.category}`);
      revalidatePath(`/product/${listing.slug}`);
      revalidatePath("/vendors");
      if (status === "approved" && listing.vendorId) {
        await updateVendorProfile(listing.vendorId, { status: "approved" });
      }
    }
  } catch {
    /* cache invalidation is best-effort */
  }
  return NextResponse.json({ ok: true });
}
