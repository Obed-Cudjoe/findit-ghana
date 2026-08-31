// PATCH /api/vendor/listings/[id] — edit the vendor's OWN listing: product
// name, price, stock, delivery fee, delivery days and description. The slug,
// category, photos and status are not editable — the slug stays fixed so the
// product link never breaks when the vendor renames (the new name shows in
// search, cards and the product page immediately).
//
// Ownership uses the same rule as listingsForVendor in lib/store.ts: the
// listing's vendorId matches the logged-in profile OR the phone numbers match
// (legacy shops listed before vendor_profiles existed). Rate-limited like the
// other vendor routes. Approved edits go live immediately — status is never
// touched, so there is no re-review.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { readVendorListings, updateVendorListing, listingsForVendor } from "@/lib/store";
import { getLoggedInVendor } from "@/lib/vendor-auth";

const MAX_PRICE_GHS = 10_000_000;
const MAX_DELIVERY_DAYS = 60;
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 140;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const vendor = await getLoggedInVendor();
  if (!vendor) return NextResponse.json({ error: "Sign in to edit a listing." }, { status: 401 });

  const limit = rateLimit(`vendor-listing-edit:${vendor.id}:${clientIp(request)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many edits. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const listings = await readVendorListings();
  const mine = listingsForVendor(listings, vendor);
  const listing = mine.find((l) => l.id === id);
  if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const patch: Parameters<typeof updateVendorListing>[1] = {};

  if (body.productName !== undefined) {
    const name = String(body.productName).trim();
    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Product name must be ${MIN_NAME_LENGTH}–${MAX_NAME_LENGTH} characters.` },
        { status: 400 }
      );
    }
    patch.productName = name;
  }

  if (body.priceGhs !== undefined) {
    const price = Number(body.priceGhs);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_GHS) {
      return NextResponse.json({ error: "Enter a valid price in cedis." }, { status: 400 });
    }
    patch.priceGhs = Math.round(price);
  }

  if (body.stockCount !== undefined) {
    if (body.stockCount === null || body.stockCount === "") {
      patch.stockCount = null;
    } else {
      const stock = Number(body.stockCount);
      if (!Number.isFinite(stock) || stock < 0) {
        return NextResponse.json({ error: "Stock must be a number of units (or empty)." }, { status: 400 });
      }
      patch.stockCount = Math.round(stock);
    }
  }

  if (body.deliveryFeeGhs !== undefined) {
    const fee = Number(body.deliveryFeeGhs);
    if (!Number.isFinite(fee) || fee < 0) {
      return NextResponse.json({ error: "Delivery fee must be a number in cedis (0 if free)." }, { status: 400 });
    }
    patch.deliveryFeeGhs = Math.round(fee);
  }

  // Sane day ranges, same spirit as the create route: 1–60, max >= min.
  if (body.deliveryDaysMin !== undefined || body.deliveryDaysMax !== undefined) {
    const day = (v: unknown, fallback: number) =>
      Math.max(1, Math.min(MAX_DELIVERY_DAYS, Math.round(Number(v ?? fallback) || fallback)));
    const min = day(body.deliveryDaysMin, listing.deliveryDaysMin);
    const max = Math.max(min, day(body.deliveryDaysMax, min));
    patch.deliveryDaysMin = min;
    patch.deliveryDaysMax = max;
  }

  if (body.description !== undefined) {
    const description = String(body.description).trim();
    if (description.length < 20) {
      return NextResponse.json({ error: "Describe the product (at least 20 characters)." }, { status: 400 });
    }
    patch.description = description;
  }

  // Re-confirm: vendor taps "still available" — bumps updatedAt only, which
  // resets the freshness clock and keeps the listing out of stale territory.
  const reconfirm = body.reconfirm === true || body.reconfirm === "1";

  if (Object.keys(patch).length === 0 && !reconfirm) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const ok = await updateVendorListing(id, patch);
  if (!ok) return NextResponse.json({ error: "Could not save the listing. Please try again." }, { status: 500 });

  // The admin queue and buyer pages read the same table — this just makes the
  // new price visible immediately instead of after the product page's cache
  // window. Buyer pages read the updated row on their next render.
  try {
    revalidatePath("/search");
    revalidatePath(`/category/${listing.category}`);
    revalidatePath(`/product/${listing.slug}`);
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${vendor.slug}`);
  } catch {
    /* cache invalidation is best-effort */
  }

  return NextResponse.json({
    ok: true,
    listing: {
      id: listing.id,
      productName: patch.productName ?? listing.productName,
      priceGhs: patch.priceGhs ?? listing.priceGhs,
      stockCount: patch.stockCount !== undefined ? patch.stockCount : listing.stockCount,
      deliveryFeeGhs: patch.deliveryFeeGhs ?? listing.deliveryFeeGhs,
      deliveryDaysMin: patch.deliveryDaysMin ?? listing.deliveryDaysMin,
      deliveryDaysMax: patch.deliveryDaysMax ?? listing.deliveryDaysMax,
      description: patch.description ?? listing.description,
      updatedAt: new Date().toISOString(),
    },
  });
}
