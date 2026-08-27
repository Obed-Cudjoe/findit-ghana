// POST /api/vendor/listings — add a product while logged into the shop dashboard.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { saveVendorListing, readVendorListings, countActiveListingsForVendor } from "@/lib/store";
import { slugify } from "@/lib/utils";
import { listingLimitFor, nextPlanAfter, VENDOR_PLANS } from "@/lib/plans";
import { getLoggedInVendor } from "@/lib/vendor-auth";

const VALID_CATEGORIES = ["phones", "laptops", "tv-audio", "appliances", "gaming", "fashion"];

export async function POST(request: NextRequest) {
  const vendor = await getLoggedInVendor();
  if (!vendor) return NextResponse.json({ error: "Sign in to add a listing." }, { status: 401 });

  const limit = rateLimit(`vendor-listings:${vendor.id}:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));

  const productName = str(body.productName);
  const category = str(body.category);
  const priceGhs = num(body.priceGhs);
  const stockCount = body.stockCount === null || body.stockCount === "" ? null : num(body.stockCount);
  const deliveryZone = str(body.deliveryZone) || "Ghana-wide";
  const deliveryDaysMin = Math.max(1, Math.min(60, num(body.deliveryDaysMin) || 1));
  const deliveryDaysMax = Math.max(deliveryDaysMin, Math.min(60, num(body.deliveryDaysMax) || deliveryDaysMin));
  const deliveryFeeGhs = Math.max(0, num(body.deliveryFeeGhs) || 0);
  const description = str(body.description);
  const websiteUrl = str(body.websiteUrl) || vendor.websiteUrl;

  if (productName.length < 3) return NextResponse.json({ error: "Enter the product name." }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  if (!priceGhs || priceGhs <= 0 || priceGhs > 10_000_000) return NextResponse.json({ error: "Enter a valid price in cedis." }, { status: 400 });
  if (description.length < 20) return NextResponse.json({ error: "Describe the product (at least 20 characters)." }, { status: 400 });

  const listings = await readVendorListings();
  const used = countActiveListingsForVendor(listings, vendor);
  const cap = listingLimitFor(vendor);
  if (used >= cap) {
    const next = nextPlanAfter(vendor);
    const nextCopy = next
      ? `Upgrade to ${VENDOR_PLANS[next].name} (GH₵${VENDOR_PLANS[next].priceGhs}/mo) on For vendors to add more.`
      : "You are on the Unlimited plan — contact us if you still cannot add listings.";
    return NextResponse.json(
      {
        error: `Your plan allows ${Number.isFinite(cap) ? `${cap} listing${cap === 1 ? "" : "s"}` : "unlimited listings"}. ${nextCopy}`,
        code: "listing_limit",
        limit: cap,
        used,
      },
      { status: 403 },
    );
  }

  const slug = `${slugify(productName)}-${Math.random().toString(36).slice(2, 8)}`;
  const ok = await saveVendorListing({
    businessName: vendor.businessName,
    contactName: vendor.contactName,
    phone: vendor.phone,
    email: vendor.email,
    productName,
    slug,
    category,
    priceGhs,
    stockCount: stockCount === null || Number.isNaN(stockCount) ? null : Math.max(0, Math.round(stockCount)),
    deliveryZone,
    deliveryDaysMin: Math.round(deliveryDaysMin),
    deliveryDaysMax: Math.round(deliveryDaysMax),
    deliveryFeeGhs,
    description,
    websiteUrl,
    vendorId: vendor.id,
    requestedPlan: vendor.plan,
  });

  if (!ok) return NextResponse.json({ error: "Could not store the listing. Please try again." }, { status: 500 });

  return NextResponse.json({ ok: true, status: "pending", listingSlug: slug });
}
