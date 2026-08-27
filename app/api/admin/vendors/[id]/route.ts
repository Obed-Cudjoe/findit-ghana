// Admin-only: set a shop's plan, 30-day expiry (after MoMo), verified badge, status.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { readVendorProfiles, updateVendorProfile } from "@/lib/store";
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
      return NextResponse.json({ error: "Pick Starter or Pro before confirming payment." }, { status: 400 });
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

function revalidateVendorPages(slug: string) {
  try {
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${slug}`);
    revalidatePath("/");
  } catch {
    /* cache invalidation is best-effort */
  }
}
