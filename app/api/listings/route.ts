// POST /api/listings — vendor self-listing (For Vendors page).
// Validates, upserts a vendor profile, enforces the plan's listing cap,
// generates a slug, and stores as "pending" for admin review.
// Accepts JSON (no photos) or multipart/form-data with files on the "images"
// field. At least MIN_LISTING_IMAGES photos are required when any are sent.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import {
  saveVendorListing,
  upsertVendorProfile,
  readVendorListings,
  countActiveListingsForVendor,
  findVendorProfileByPhone,
} from "@/lib/store";
import { slugify } from "@/lib/utils";
import { isPlanId, listingLimitFor, nextPlanAfter, VENDOR_PLANS, type PlanId } from "@/lib/plans";
import {
  hashVendorPassword,
  MIN_VENDOR_PASSWORD,
  signVendorToken,
  vendorCookieOptions,
  vendorPasswordMatches,
  VENDOR_COOKIE,
} from "@/lib/vendor-auth";
import {
  collectImageFiles,
  saveListingImages,
  MIN_LISTING_IMAGES,
  MAX_LISTING_IMAGES,
} from "@/lib/uploads";

const VALID_CATEGORIES = ["phones", "laptops", "tv-audio", "appliances", "gaming", "fashion"];

// Field names are identical for JSON and multipart bodies; the form just
// switches to FormData so it can carry the photo files.
async function readBody(
  request: NextRequest,
): Promise<{ fields: Record<string, string>; images: Awaited<ReturnType<typeof collectImageFiles>> } | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { error: "Invalid form data." };
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && !(key in fields)) fields[key] = value;
    }
    const images = await collectImageFiles(form);
    return { fields, images };
  }
  try {
    const json = (await request.json()) as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === "string") fields[k] = v;
      else if (v === null) fields[k] = "";
      else fields[k] = String(v);
    }
    return { fields, images: [] };
  } catch {
    return { error: "Invalid JSON body." };
  }
}

export async function POST(request: NextRequest) {
  // Spam guard: 3 submissions per 60 * 60 * 1000 per IP (per serverless instance).
  const limit = rateLimit(`listings:${clientIp(request)}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  const parsed = await readBody(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.fields;
  const images = parsed.images;

  const str = (v: string | undefined) => (v ?? "").trim();
  const num = (v: string | undefined) => Number(v);

  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const phone = str(body.phone);
  const email = str(body.email);
  const productName = str(body.productName);
  const category = str(body.category);
  const priceGhs = num(body.priceGhs);
  const stockCount = body.stockCount === "" || body.stockCount === undefined ? null : num(body.stockCount);
  const deliveryZone = str(body.deliveryZone) || "Ghana-wide";
  const deliveryDaysMin = Math.max(1, Math.min(60, num(body.deliveryDaysMin) || 1));
  const deliveryDaysMax = Math.max(deliveryDaysMin, Math.min(60, num(body.deliveryDaysMax) || deliveryDaysMin));
  const deliveryFeeGhs = Math.max(0, num(body.deliveryFeeGhs) || 0);
  const description = str(body.description);
  const websiteUrl = str(body.websiteUrl);
  const requestedPlan: PlanId = isPlanId(body.plan) ? body.plan : "free";
  const password = str(body.password);

  if (businessName.length < 2) return NextResponse.json({ error: "Enter your business name." }, { status: 400 });
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: "Enter a valid phone / WhatsApp number." }, { status: 400 });
  if (productName.length < 3) return NextResponse.json({ error: "Enter the product name." }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  if (!priceGhs || priceGhs <= 0 || priceGhs > 10_000_000) return NextResponse.json({ error: "Enter a valid price in cedis." }, { status: 400 });
  if (description.length < 20) return NextResponse.json({ error: "Describe the product (at least 20 characters)." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (images.length > 0 && images.length < MIN_LISTING_IMAGES) {
    return NextResponse.json(
      { error: `Add at least ${MIN_LISTING_IMAGES} photos of the product — buyers look at them before contacting you.` },
      { status: 400 },
    );
  }
  if (images.length > MAX_LISTING_IMAGES) {
    return NextResponse.json({ error: `Use ${MAX_LISTING_IMAGES} photos or fewer.` }, { status: 400 });
  }

  const existing = await findVendorProfileByPhone(digits);
  let passwordHash: string | undefined;
  if (password) {
    if (password.length < MIN_VENDOR_PASSWORD) {
      return NextResponse.json({ error: `Password must be at least ${MIN_VENDOR_PASSWORD} characters.` }, { status: 400 });
    }
    if (!existing?.passwordHash) passwordHash = await hashVendorPassword(password);
  } else if (!existing) {
    return NextResponse.json({ error: "Set a password (at least 8 characters) so you can log in to your shop dashboard." }, { status: 400 });
  } else if (!existing.passwordHash) {
    return NextResponse.json({ error: "This shop has no dashboard login yet. Set a password (at least 8 characters) to continue." }, { status: 400 });
  }

  const profile = await upsertVendorProfile({
    businessName,
    contactName,
    phone: digits,
    email,
    websiteUrl,
    plan: requestedPlan,
    paymentStatus: requestedPlan === "free" ? "none" : "pending",
    passwordHash,
  });

  if (profile) {
    const listings = await readVendorListings();
    const used = countActiveListingsForVendor(listings, profile);
    const cap = listingLimitFor(profile);
    if (used >= cap) {
      const next = nextPlanAfter(profile);
      const nextCopy = next
        ? `Upgrade to ${VENDOR_PLANS[next].name} (GH₵${VENDOR_PLANS[next].priceGhs}/mo) to add more — pick the plan above and pay via MoMo.`
        : "You are on the Unlimited plan — contact us if you still cannot add listings.";
      return NextResponse.json(
        {
          error: `Your ${VENDOR_PLANS[listingLimitFor(profile) === 1 ? "free" : profile.plan].name} plan allows ${Number.isFinite(cap) ? `${cap} listing${cap === 1 ? "" : "s"}` : "unlimited listings"}. ${nextCopy}`,
          code: "listing_limit",
          limit: cap,
          used,
        },
        { status: 403 },
      );
    }
  }

  // unique slug: product name + short random suffix
  const slug = `${slugify(productName)}-${Math.random().toString(36).slice(2, 8)}`;

  // Store the photos first so a failed upload never leaves a listing behind
  // with fewer than the 3 photos buyers expect.
  const savedImages = await saveListingImages(slug, images);
  if (!savedImages.ok) return NextResponse.json({ error: savedImages.error }, { status: 400 });

  const ok = await saveVendorListing({
    businessName,
    contactName,
    phone: digits,
    email,
    productName,
    slug,
    category,
    priceGhs,
    stockCount: stockCount === null ? null : Math.max(0, Math.round(stockCount)),
    deliveryZone,
    deliveryDaysMin: Math.round(deliveryDaysMin),
    deliveryDaysMax: Math.round(deliveryDaysMax),
    deliveryFeeGhs,
    description,
    websiteUrl,
    imageUrls: savedImages.urls,
    vendorId: profile?.id ?? null,
    requestedPlan,
  });

  if (!ok) return NextResponse.json({ error: "Could not store the listing. Please try again." }, { status: 500 });

  const paymentRequired = requestedPlan !== "free" && (!profile || profile.paymentStatus !== "confirmed");

  let loggedIn = false;
  let token: string | null = null;
  if (profile && password.length >= MIN_VENDOR_PASSWORD) {
    const canSign = passwordHash
      ? true
      : await vendorPasswordMatches(password, profile.passwordHash);
    if (canSign) {
      token = await signVendorToken(profile.id, profile.slug);
      loggedIn = true;
    }
  }

  const res = NextResponse.json({
    ok: true,
    status: "pending",
    plan: requestedPlan,
    paymentRequired,
    vendorSlug: profile?.slug ?? null,
    listingSlug: slug,
    loggedIn,
    imageCount: savedImages.urls.length,
  });
  if (token) res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}
