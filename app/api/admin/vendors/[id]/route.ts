// Admin-only: set a shop's plan, 30-day expiry (after MoMo), verified badge,
// status — or DELETE the whole shop (suspected fraud / bad actor).
// Like the other admin routes, auth is enforced by middleware for /api/admin/*.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { readVendorProfiles, updateVendorProfile, readVendorListings, listingsForVendor, deleteVendorProfile } from "@/lib/store";
import { daysFromNow, isPlanId } from "@/lib/plans";
import type { VendorPaymentStatus, VendorProfileStatus } from "@/lib/types";

const VALID_STATUS: VendorProfileStatus[] = ["pending", "approved", "rejected"];
const VALID_PAYMENT: VendorPaymentStatus[] = ["none", "pending", "confirmed"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    plan?: string;
    planExpiresAt?: string | null;
    paymentStatus?: string;
    verified?: boolean;
    status?: string;
    momoReference?: string;
  };

  const profiles = await readVendorProfiles();
  const existing = profiles.find((p) => p.id === id);
  if (!existing) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  // One-click: confirm MoMo → grant plan for 30 days and approve the shop.
  if (body.action === "confirm-payment") {
    const plan = isPlanId(body.plan) ? body.plan : existing.plan === "free" ? "starter" : existing.plan;
    if (plan === "free") {
      return NextResponse.json({ error: "Pick Starter, Pro or Unlimited before confirming payment." }, { status: 400 });
    }
    const ok = await updateVendorProfile(id, {
      plan,
      paymentStatus: "confirmed",
      planExpiresAt: daysFromNow(30),
      status: "approved",
    });
    if (!ok) return NextResponse.json({ error: "Could not update vendor." }, { status: 500 });
    revalidateVendorPages(existing.slug);
    return NextResponse.json({ ok: true, plan, planExpiresAt: daysFromNow(30) });
  }

  if (body.action === "set-free") {
    const ok = await updateVendorProfile(id, {
      plan: "free",
      paymentStatus: "none",
      planExpiresAt: null,
    });
    if (!ok) return NextResponse.json({ error: "Could not update vendor." }, { status: 500 });
    revalidateVendorPages(existing.slug);
    return NextResponse.json({ ok: true, plan: "free" });
  }

  const patch: Parameters<typeof updateVendorProfile>[1] = {};
  if (body.plan !== undefined) {
    if (!isPlanId(body.plan)) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    patch.plan = body.plan;
  }
  if (body.planExpiresAt !== undefined) {
    const until = body.planExpiresAt;
    if (until !== null && (typeof until !== "string" || Number.isNaN(new Date(until).getTime()))) {
      return NextResponse.json({ error: "planExpiresAt must be an ISO date or null." }, { status: 400 });
    }
    patch.planExpiresAt = until;
  }
  if (body.paymentStatus !== undefined) {
    if (!VALID_PAYMENT.includes(body.paymentStatus as VendorPaymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    patch.paymentStatus = body.paymentStatus as VendorPaymentStatus;
  }
  if (typeof body.verified === "boolean") patch.verified = body.verified;
  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status as VendorProfileStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = body.status as VendorProfileStatus;
  }
  if (typeof body.momoReference === "string") patch.momoReference = body.momoReference;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const ok = await updateVendorProfile(id, patch);
  if (!ok) return NextResponse.json({ error: "Could not update vendor." }, { status: 500 });
  revalidateVendorPages(existing.slug);
  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/admin/vendors/[id] — permanently remove a shop.
 * Deletes, in this order: (a) every listing the shop owns (vendor_id match
 * plus the legacy phone-key match used by listingsForVendor), (b) the shop's
 * uploaded photos (Supabase Storage objects / local public/uploads folders),
 * (c) the vendor_profiles row itself. Click events and buyer reports are kept
 * on purpose — they are the audit trail for a reported bad actor.
 *
 * Official price sources (Jumia, CompuGhana, Franko, Telefonika) live in JSON
 * catalogues, never in vendor_profiles, so the UI only offers this for actual
 * shop rows — nothing extra to guard here.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profiles = await readVendorProfiles();
  const existing = profiles.find((p) => p.id === id);
  if (!existing) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

  const listings = await readVendorListings();
  const theirs = listingsForVendor(listings, existing);

  const ok = await deleteVendorProfile(id, { listings: theirs, phone: existing.phone });
  if (!ok) {
    return NextResponse.json({ error: "Could not delete the shop. Please try again." }, { status: 500 });
  }

  // Invalidate caches so the shop leaves the directory and its product pages
  // stop being served without waiting for the next revalidation window.
  try {
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${existing.slug}`);
    revalidatePath("/search");
    revalidatePath("/");
    for (const l of theirs) {
      revalidatePath(`/product/${l.slug}`);
      revalidatePath(`/category/${l.category}`);
    }
  } catch {
    /* cache invalidation is best-effort */
  }

  return NextResponse.json({ ok: true, deletedListings: theirs.length, deletedPhotos: theirs.reduce((n, l) => n + (l.imageUrls?.length ?? 0), 0) });
}

function revalidateVendorPages(slug: string) {
  try {
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${slug}`);
    revalidatePath("/");
  } catch {
    /* cache invalidation is best-effort */
  }
}
