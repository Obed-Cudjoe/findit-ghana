// Admin-only: approve / reject a vendor listing.
// Approval instantly revalidates search, category and product pages
// so the listing appears on the site immediately.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { updateVendorListingStatus, readVendorListings } from "@/lib/store";

const VALID = ["pending", "approved", "rejected"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
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
    }
  } catch {
    /* cache invalidation is best-effort */
  }
  return NextResponse.json({ ok: true });
}
