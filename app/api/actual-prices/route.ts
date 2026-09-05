// /api/actual-prices — COMP-19: crowd-sourced "what people actually paid".
// POST: shopper submits what they paid for this product (held for admin
// approval before it ever shows publicly).
// GET ?slug=… : approved aggregate only (count, min, max) — the public page
// renders numbers, never individual submissions.
import { NextResponse, type NextRequest } from "next/server";
import { readActualPrices, saveActualPrice } from "@/lib/store";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const MAX_PRICE_GHS = 10_000_000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(`actual-price:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    productSlug?: string;
    pricePaidGhs?: unknown;
    shopName?: string;
  };
  const slug = typeof body.productSlug === "string" ? body.productSlug.trim() : "";
  const price = typeof body.pricePaidGhs === "number" ? body.pricePaidGhs : Number(body.pricePaidGhs);
  const shop = typeof body.shopName === "string" ? body.shopName.trim().slice(0, 80) : "";

  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: "Missing product." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE_GHS) {
    return NextResponse.json({ error: "Enter a realistic price in cedis." }, { status: 400 });
  }

  const ok = await saveActualPrice({ productSlug: slug, pricePaidGhs: price, shopName: shop || undefined });
  if (!ok) return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const rows = (await readActualPrices()).filter(
    (r) => r.productSlug === slug && r.status === "approved",
  );
  if (rows.length === 0) {
    return NextResponse.json(
      { count: 0, min: null, max: null },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
    );
  }
  const prices = rows.map((r) => r.pricePaidGhs);
  return NextResponse.json(
    {
      count: rows.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
  );
}
