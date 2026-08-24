// Protects the admin area with a signed session cookie.
// The cookie is set by /api/admin/login after checking ADMIN_PASSWORD.
// NOTE: demo-grade auth — for a production handoff, swap this for
// Supabase Auth (schema and client are already wired in lib/store.ts).
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.ADMIN_PASSWORD || "findit-admin-2026");

export async function middleware(request: NextRequest) {
  // The login/logout endpoints themselves must stay reachable unauthenticated.
  if (
    request.nextUrl.pathname === "/admin/login" ||
    request.nextUrl.pathname === "/api/admin/login" ||
    request.nextUrl.pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("findit_admin")?.value;

  if (token) {
    try {
      await jwtVerify(token, SECRET);
      return NextResponse.next();
    } catch {
      /* invalid token falls through to login */
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
