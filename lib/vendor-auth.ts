// Vendor shop login — phone + password, 12h JWT cookie (`findit_vendor`).
// Password hashes use scrypt (Node crypto). Middleware only verifies the JWT.
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { findVendorProfileById } from "@/lib/store";
import type { VendorProfile } from "@/lib/types";
import { VENDOR_COOKIE, getVendorJwtSecret, vendorCookieOptions } from "@/lib/vendor-session";

export { VENDOR_COOKIE, getVendorJwtSecret, vendorCookieOptions };

export const MIN_VENDOR_PASSWORD = 8;

const scrypt = promisify(scryptCb);

export async function hashVendorPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function vendorPasswordMatches(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !password) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = (await scrypt(password, salt, 64)) as Buffer;
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function signVendorToken(vendorId: string, slug: string): Promise<string> {
  return new SignJWT({ role: "vendor", vendorId, slug })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getVendorJwtSecret());
}

export async function readVendorSession(): Promise<{ vendorId: string; slug: string } | null> {
  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getVendorJwtSecret());
    if (payload.role !== "vendor" || typeof payload.vendorId !== "string" || typeof payload.slug !== "string") {
      return null;
    }
    return { vendorId: payload.vendorId, slug: payload.slug };
  } catch {
    return null;
  }
}

export async function getLoggedInVendor(): Promise<VendorProfile | null> {
  const session = await readVendorSession();
  if (!session) return null;
  const profile = await findVendorProfileById(session.vendorId);
  return profile ?? null;
}

/** Safe to send to the browser — never includes the hash. */
export function publicVendorProfile(p: VendorProfile) {
  return {
    id: p.id,
    businessName: p.businessName,
    slug: p.slug,
    contactName: p.contactName,
    phone: p.phone,
    email: p.email,
    websiteUrl: p.websiteUrl,
    plan: p.plan,
    planExpiresAt: p.planExpiresAt,
    paymentStatus: p.paymentStatus,
    verified: p.verified,
    logoHue: p.logoHue,
    status: p.status,
    createdAt: p.createdAt,
    hasPassword: !!p.passwordHash,
  };
}
