// Edge-safe vendor session helpers (middleware). No Node crypto / store.
export const VENDOR_COOKIE = "findit_vendor";

export function getVendorJwtSecret(): Uint8Array {
  const s = process.env.VENDOR_JWT_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  if (s) return new TextEncoder().encode(`findit-vendor:${s}`);
  // Stable across Edge middleware and Node routes so local cookies verify.
  // Production must set ADMIN_PASSWORD or VENDOR_JWT_SECRET (this string is public).
  return new TextEncoder().encode("findit-vendor:unconfigured");
}

export function vendorCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 12 };
}
