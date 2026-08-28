// POST /api/listings — vendor shop signup (For Vendors page).
// Validates the business + plan + password fields, upserts the vendor profile
// (pending in /admin/vendors), sets the dashboard login cookie and returns the
// MoMo `paymentRequired` flow for paid plans.
// It does NOT create any listing — products are added from the dashboard
// (POST /api/vendor/listings), which is the only place listings are created.
import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { upsertVendorProfile, findVendorProfileByPhone } from "@/lib/store";
import { isPlanId, type PlanId } from "@/lib/plans";
import {
  hashVendorPassword,
  MIN_VENDOR_PASSWORD,
  signVendorToken,
  vendorCookieOptions,
  vendorPasswordMatches,
  VENDOR_COOKIE,
} from "@/lib/vendor-auth";

// Field names are identical for JSON and multipart bodies; multipart is still
// accepted so older clients keep working.
async function readBody(
  request: NextRequest,
): Promise<{ fields: Record<string, string> } | { error: string }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { error: "Invalid form data." };
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && !(key in fields)) fields[key] = value;
    }
    return { fields };
  }
  try {
    const json = (await request.json()) as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === "string") fields[k] = v;
      else if (v === null) fields[k] = "";
      else fields[k] = String(v);
    }
    return { fields };
  } catch {
    return { error: "Invalid JSON body." };
  }
}

export async function POST(request: NextRequest) {
  // Spam guard: 3 submissions per 60 * 60 * 1000 per IP (per serverless instance).
  const limit = rateLimit(`listings:${clientIp(request)}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }

  const parsed = await readBody(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.fields;

  const str = (v: string | undefined) => (v ?? "").trim();

  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const phone = str(body.phone);
  const email = str(body.email);
  const websiteUrl = str(body.websiteUrl);
  const requestedPlan: PlanId = isPlanId(body.plan) ? body.plan : "free";
  const password = str(body.password);

  if (businessName.length < 2) return NextResponse.json({ error: "Enter your business name." }, { status: 400 });
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 9 || digits.length > 15) return NextResponse.json({ error: "Enter a valid phone / WhatsApp number." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const existing = await findVendorProfileByPhone(digits);
  let passwordHash: string | undefined;
  if (password) {
    if (password.length < MIN_VENDOR_PASSWORD) {
      return NextResponse.json({ error: `Password must be at least ${MIN_VENDOR_PASSWORD} characters.` }, { status: 400 });
    }
    if (!existing?.passwordHash) passwordHash = await hashVendorPassword(password);
  } else if (!existing) {
    return NextResponse.json({ error: "Set a password (at least 8 characters) so you can log in to your shop dashboard." }, { status: 400 });
  } else if (!existing.passwordHash) {
    return NextResponse.json({ error: "This shop has no dashboard login yet. Set a password (at least 8 characters) to continue." }, { status: 400 });
  }

  const profile = await upsertVendorProfile({
    businessName,
    contactName,
    phone: digits,
    email,
    websiteUrl,
    plan: requestedPlan,
    paymentStatus: requestedPlan === "free" ? "none" : "pending",
    passwordHash,
  });

  if (!profile) return NextResponse.json({ error: "Could not register your shop. Please try again." }, { status: 500 });

  const paymentRequired = requestedPlan !== "free" && profile.paymentStatus !== "confirmed";

  let loggedIn = false;
  let token: string | null = null;
  if (password.length >= MIN_VENDOR_PASSWORD) {
    const canSign = passwordHash
      ? true
      : await vendorPasswordMatches(password, profile.passwordHash);
    if (canSign) {
      token = await signVendorToken(profile.id, profile.slug);
      loggedIn = true;
    }
  }

  const res = NextResponse.json({
    ok: true,
    status: "pending",
    plan: requestedPlan,
    paymentRequired,
    vendorSlug: profile.slug,
    loggedIn,
  });
  if (token) res.cookies.set(VENDOR_COOKIE, token, vendorCookieOptions());
  return res;
}
