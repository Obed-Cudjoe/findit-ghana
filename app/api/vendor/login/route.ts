// Vendor dashboard login — phone + password. Issues a 12h `findit_vendor` cookie.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { findVendorProfileByPhone } from "@/lib/store";
import { signVendorToken, vendorCookieOptions, vendorPasswordMatches, VENDOR_COOKIE } from "@/lib/vendor-auth";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`vendor-login:${ip}`, MAX_FAILURES, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSec} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { phone?: string; password?: string };
  const digits = typeof body.phone === "string" ? body.phone.replace(/[^0-9]/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (digits.length < 9 || digits.length > 15 || !password) {
    return NextResponse.json({ error: "Enter your shop phone number and password." }, { status: 400 });
  }

  const profile = await findVendorProfileByPhone(digits);
  if (!profile) {
    return NextResponse.json({ error: "No shop found for that number. List a product first." }, { status: 401 });
  }
  if (!profile.passwordHash) {
    return NextResponse.json(
      { error: "This shop has no login yet. Create one with the form below.", code: "no_password" },
      { status: 403 },
    );
  }
  if (!(await vendorPasswordMatches(password, profile.passwordHash))) {
    return NextResponse.json({ error: "Wrong phone or password." }, { status: 401 });
  }

  const token = await signVendorToken(profile.id, profile.slug);
  const res = NextResponse.json({ ok: true, slug: profile.slug });
  res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}
