// Admin login — issues a signed 12h session cookie after checking
// ADMIN_PASSWORD. Fail-closed: no password configured = nobody logs in.
// Failed attempts are rate-limited per IP to make brute-forcing impractical.
import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";
import { getAdminJwtSecret, getAdminPassword, passwordMatches } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { error: "Admin login is disabled — set the ADMIN_PASSWORD environment variable first." },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, MAX_FAILURES, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limit.retryAfterSec} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordMatches(password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getAdminJwtSecret());
  const res = NextResponse.json({ ok: true });
  res.cookies.set("findit_admin", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
