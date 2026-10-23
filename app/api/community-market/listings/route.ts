import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { COMMUNITY_MARKET_CATEGORIES, type CommunityMarketCategory } from "@/lib/community-market-categories";
import { createCommunityMarketListing, readCommunityMarketListings } from "@/lib/community-market";
import { collectImageFiles, saveListingImages } from "@/lib/uploads";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const listings = await readCommunityMarketListings();
  return NextResponse.json({ listings }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(`community-listing:${clientIp(request)}`, 4, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many listing submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "The community market is not ready to accept listings yet." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Please submit the listing form again." }, { status: 400 });
  }
  const get = (name: string) => String(form.get(name) ?? "").trim();
  const title = get("title").slice(0, 100);
  const category = get("category") as CommunityMarketCategory;
  const description = get("description").slice(0, 1200);
  const priceGhs = Number(get("priceGhs"));
  const condition = get("condition");
  const location = get("location").slice(0, 100);
  const sellerName = get("sellerName").slice(0, 80);
  const sellerWhatsapp = get("sellerWhatsapp").replace(/[^0-9]/g, "").slice(0, 15);
  const consent = get("publicConsent") === "yes";

  if (title.length < 3) return NextResponse.json({ error: "Enter an item or service name (at least 3 characters)." }, { status: 400 });
  if (!COMMUNITY_MARKET_CATEGORIES.some((c) => c.slug === category)) return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  if (!Number.isFinite(priceGhs) || priceGhs < 0 || priceGhs > 1_000_000_000) return NextResponse.json({ error: "Enter a valid price in cedis, or 0 for free." }, { status: 400 });
  if (!sellerName) return NextResponse.json({ error: "Enter the name buyers should see." }, { status: 400 });
  if (sellerWhatsapp.length < 9) return NextResponse.json({ error: "Enter a valid WhatsApp number with country code if possible." }, { status: 400 });
  if (!consent) return NextResponse.json({ error: "Please confirm that your seller name, WhatsApp number, photos and listing details will be public if approved." }, { status: 400 });
  if (!["new", "used", "refurbished", "unspecified"].includes(condition)) return NextResponse.json({ error: "Choose the item's condition." }, { status: 400 });

  const images = await collectImageFiles(form);
  if (images.length > 6) return NextResponse.json({ error: "Upload 6 photos or fewer." }, { status: 400 });
  const slug = `community-${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`;
  let imageUrls: string[] = [];
  if (images.length) {
    const saved = await saveListingImages(slug, images, { requireMin: false });
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });
    imageUrls = saved.urls;
  }

  const saved = await createCommunityMarketListing({
    slug,
    title,
    category,
    description,
    priceGhs,
    condition,
    location,
    sellerName,
    sellerWhatsapp,
    imageUrls,
  });
  if (!saved) return NextResponse.json({ error: "Could not save your listing. Please try again later." }, { status: 500 });
  return NextResponse.json({ ok: true, status: "pending" }, { status: 201 });
}
