// POST /api/alerts — subscribe to a price-drop alert (WhatsApp).
// Stores the watchlist entry; the daily refresh triggers it when the
// product's lowest price reaches the target. Delivery is manual via the
// admin dashboard (one-tap wa.me links) until a WhatsApp Business API
// account is connected.
import { NextResponse, type NextRequest } from "next/server";
import { savePriceAlert } from "@/lib/store";
import { getAnyProduct, getOffersForProduct } from "@/lib/data";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const productSlug = typeof body.productSlug === "string" ? body.productSlug.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.replace(/[^0-9]/g, "") : "";
  const target = Number(body.targetPriceGhs);

  // Product must exist (catalogue or approved vendor listing)
  const found = await getAnyProduct(productSlug);
  if (!found) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  if (phone.length < 9 || phone.length > 15) {
    return NextResponse.json({ error: "Enter a valid WhatsApp number." }, { status: 400 });
  }
  if (!Number.isFinite(target) || target <= 0 || target > 10_000_000) {
    return NextResponse.json({ error: "Enter a valid target price in cedis." }, { status: 400 });
  }

  const current = getOffersForProduct(productSlug)[0]?.priceGhs;
  if (current !== undefined && target >= current) {
    return NextResponse.json(
      { error: `The price is already ${formatGhsRaw(current)} — set a target below today's price.` },
      { status: 400 },
    );
  }

  const ok = await savePriceAlert({
    productSlug,
    productName: found.product.name,
    phone,
    targetPriceGhs: Math.round(target),
  });
  if (!ok) return NextResponse.json({ error: "Could not save the alert. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function formatGhsRaw(n: number): string {
  return "GH₵" + n.toLocaleString("en-GH");
}
