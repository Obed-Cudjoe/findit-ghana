// POST /api/listings — vendor self-listing (For Vendors page).
// Validates, generates a slug, and stores as "pending" for admin review.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { saveVendorListing } from "@/lib/store";
import { slugify } from "@/lib/utils";

const VALID_CATEGORIES = ["phones", "laptops", "tv-audio", "appliances", "gaming", "fashion"];

export async function POST(request: NextRequest) {
  // Spam guard: 3 submissions per 60 * 60 * 1000 per IP (per serverless instance).
  const limit = rateLimit(`listings:${clientIp(request)}`, 3, 60 * 60 * 1000);
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

  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const phone = str(body.phone);
  const email = str(body.email);
  const productName = str(body.productName);
  const category = str(body.category);
  const priceGhs = num(body.priceGhs);
  const stockCount = body.stockCount === null || body.stockCount === "" ? null : num(body.stockCount);
  const deliveryZone = str(body.deliveryZone) || "Ghana-wide";
  const deliveryDaysMin = Math.max(1, Math.min(60, num(body.deliveryDaysMin) || 1));
  const deliveryDaysMax = Math.max(deliveryDaysMin, Math.min(60, num(body.deliveryDaysMax) || deliveryDaysMin));
  const deliveryFeeGhs = Math.max(0, num(body.deliveryFeeGhs) || 0);
  const description = str(body.description);
  const websiteUrl = str(body.websiteUrl);

  if (businessName.length < 2) return NextResponse.json({ error: "Enter your business name." }, { status: 400 });
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: "Enter a valid phone / WhatsApp number." }, { status: 400 });
  if (productName.length < 3) return NextResponse.json({ error: "Enter the product name." }, { status: 400 });
  if (!VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  if (!priceGhs || priceGhs <= 0 || priceGhs > 10_000_000) return NextResponse.json({ error: "Enter a valid price in cedis." }, { status: 400 });
  if (description.length < 20) return NextResponse.json({ error: "Describe the product (at least 20 characters)." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  // unique slug: product name + short random suffix
  const slug = `${slugify(productName)}-${Math.random().toString(36).slice(2, 8)}`;

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
  });

  if (!ok) return NextResponse.json({ error: "Could not store the listing. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true, status: "pending" });
}
