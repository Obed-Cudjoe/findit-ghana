// First-time dashboard password for shops that listed before login existed.
// Requires the shop phone plus a matching business name so a stranger with the
// number cannot claim the account.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { findVendorProfileByPhone, updateVendorProfile } from "@/lib/store";
import {
  hashVendorPassword,
  MIN_VENDOR_PASSWORD,
  signVendorToken,
  vendorCookieOptions,
  VENDOR_COOKIE,
} from "@/lib/vendor-auth";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

function namesMatch(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return !!norm(a) && norm(a) === norm(b);
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const limit = rateLimit(`vendor-password:${ip}`, MAX_FAILURES, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSec} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    phone?: string;
    businessName?: string;
    password?: string;
  };
  const digits = typeof body.phone === "string" ? body.phone.replace(/[^0-9]/g, "") : "";
  const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (digits.length < 9 || digits.length > 15) {
    return NextResponse.json({ error: "Enter the WhatsApp number you listed with." }, { status: 400 });
  }
  if (businessName.length < 2) {
    return NextResponse.json({ error: "Enter your business name exactly as listed." }, { status: 400 });
  }
  if (password.length < MIN_VENDOR_PASSWORD) {
    return NextResponse.json({ error: `Password must be at least ${MIN_VENDOR_PASSWORD} characters.` }, { status: 400 });
  }

  const profile = await findVendorProfileByPhone(digits);
  if (!profile) {
    return NextResponse.json({ error: "No shop found for that number. List a product on For vendors first." }, { status: 404 });
  }
  if (profile.passwordHash) {
    return NextResponse.json({ error: "This shop already has a login. Sign in with your password." }, { status: 409 });
  }
  if (!namesMatch(businessName, profile.businessName)) {
    return NextResponse.json({ error: "Business name does not match this shop." }, { status: 403 });
  }

  const passwordHash = await hashVendorPassword(password);
  const ok = await updateVendorProfile(profile.id, { passwordHash });
  if (!ok) return NextResponse.json({ error: "Could not save the password. Try again." }, { status: 500 });

  const token = await signVendorToken(profile.id, profile.slug);
  const res = NextResponse.json({ ok: true, slug: profile.slug });
  res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}
