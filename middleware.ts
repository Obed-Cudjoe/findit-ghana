// Protects /admin and /vendor with signed session cookies.
// /vendors (public directory) is NOT matched — only /vendor and /vendor/*.
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getAdminJwtSecret } from "@/lib/admin-auth";
import { VENDOR_COOKIE, getVendorJwtSecret } from "@/lib/vendor-session";

function isVendorDashboardPath(pathname: string): boolean {
  return pathname === "/vendor" || pathname.startsWith("/vendor/") || pathname === "/api/vendor" || pathname.startsWith("/api/vendor/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isVendorDashboardPath(pathname)) {
    if (
      pathname === "/vendor/login" ||
      pathname === "/api/vendor/login" ||
      pathname === "/api/vendor/logout" ||
      pathname === "/api/vendor/password"
    ) {
      return NextResponse.next();
    }
    const token = request.cookies.get(VENDOR_COOKIE)?.value;
    if (token) {
      try {
        await jwtVerify(token, getVendorJwtSecret());
        return NextResponse.next();
      } catch {
        /* invalid token falls through */
      }
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/vendor/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin area
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("findit_admin")?.value;
  if (token) {
    try {
      await jwtVerify(token, getAdminJwtSecret());
      return NextResponse.next();
    } catch {
      /* invalid token falls through to login */
    }
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/vendor", "/vendor/:path*", "/api/vendor/:path*"],
};
