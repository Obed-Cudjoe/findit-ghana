// Admin-only: approve / reject a vendor listing.
// Approval instantly revalidates search, category and product pages
// so the listing appears on the site immediately.
// Rejection also deletes the listing's uploaded photos from storage —
// the free Supabase tier is 1 GB, and rejected photos would otherwise
// sit there forever.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { cacheReset } from "@/lib/ttl-cache";
import { updateVendorListingStatus, readVendorListings, setVendorListingFeatured, updateVendorProfile, readVendorProfiles, reassignVendorListing } from "@/lib/store";
import { deleteVendorListingPhotos } from "@/lib/uploads";
import { phoneKey } from "@/lib/plans";

const VALID = ["pending", "approved", "rejected"] as const;

// PATCH accepts either { status } (approve/reject) or { featuredUntil } (paid
// featured placement: ISO date string, or null to clear), or both.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string; featuredUntil?: string | null; action?: string; phone?: string };

  // Admin: move this listing onto a vendor's own shop (matched by their
  // WhatsApp number). Used when the admin listed on the vendor's behalf and
  // the vendor later registered with a different number.
  if (body.action === "reassign") {
    const phone = typeof body.phone === "string" ? body.phone.replace(/[^0-9]/g, "") : "";
    if (phone.length < 9 || phone.length > 15) {
      return NextResponse.json({ error: "Enter the vendor's phone / WhatsApp number." }, { status: 400 });
    }
    const profiles = await readVendorProfiles();
    const target = profiles.find((p) => phoneKey(p.phone) === phoneKey(phone));
    if (!target) {
      return NextResponse.json(
        { error: "No vendor shop found for that number. Register the vendor first (their shop appears in /admin/vendors), or use \u2795 Add listing (for vendor)." },
        { status: 400 },
      );
    }
    const ok = await reassignVendorListing(id, {
      vendorId: target.id,
      businessName: target.businessName,
      contactName: target.contactName,
      phone: target.phone,
      email: target.email,
      websiteUrl: target.websiteUrl,
    });
    if (!ok) return NextResponse.json({ error: "Could not reassign the listing." }, { status: 500 });
    cacheReset("marketplace-state");
    return NextResponse.json({ ok: true, businessName: target.businessName });
  }

  if (body.featuredUntil !== undefined) {
    const until = body.featuredUntil;
    if (until !== null && (typeof until !== "string" || Number.isNaN(new Date(until).getTime()))) {
      return NextResponse.json({ error: "featuredUntil must be an ISO date or null." }, { status: 400 });
    }
    const ok = await setVendorListingFeatured(id, until);
    if (!ok) return NextResponse.json({ error: "Listing not found or store unavailable." }, { status: 404 });
    cacheReset("marketplace-state");
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
      // Free-tier storage hygiene: a rejected listing's photos are dead
      // weight — remove them (best-effort, never blocks the status change).
      if (status === "rejected") {
        await deleteVendorListingPhotos([listing]);
      }
    }
  } catch {
    /* cache invalidation is best-effort */
  }
  cacheReset("marketplace-state");
  return NextResponse.json({ ok: true });
}
