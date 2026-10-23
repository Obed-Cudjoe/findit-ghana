import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { findVendorProfileBySlug, isSupabaseMode } from "@/lib/store";
import { readVendorSession } from "@/lib/vendor-auth";
import { initializeVendorCheckout, paystackSecret } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`paystack-init:${clientIp(request)}`, 6, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (!paystackSecret()) {
    return NextResponse.json({ error: "Paystack is not configured yet. Please contact FindIt Ghana support." }, { status: 503 });
  }
  if (!isSupabaseMode()) {
    return NextResponse.json({ error: "Online payments are not ready until the production payment database is configured." }, { status: 503 });
  }

  let body: { vendorSlug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const vendorSlug = typeof body.vendorSlug === "string" ? body.vendorSlug.trim().slice(0, 100) : "";
  if (!vendorSlug) return NextResponse.json({ error: "Missing shop reference." }, { status: 400 });

  const profile = await findVendorProfileBySlug(vendorSlug);
  if (!profile) return NextResponse.json({ error: "Shop not found. Please contact support." }, { status: 404 });
  if (profile.status === "rejected") return NextResponse.json({ error: "This shop is not eligible for plan payments." }, { status: 403 });
  if (profile.paymentStatus === "confirmed") {
    const session = await readVendorSession();
    if (!session || session.vendorId !== profile.id) {
      return NextResponse.json({ error: "Sign in as this shop to renew its plan." }, { status: 401 });
    }
  }
  if (!profile.email) return NextResponse.json({ error: "Add an email address to the shop profile before paying." }, { status: 400 });

  const result = await initializeVendorCheckout(profile);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ authorizationUrl: result.authorizationUrl }, { headers: { "Cache-Control": "no-store" } });
}
