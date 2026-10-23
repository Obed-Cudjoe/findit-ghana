import { NextResponse, type NextRequest } from "next/server";
import { isValidPaystackSignature, verifyAndActivateVendorPayment } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.event !== "charge.success") return NextResponse.json({ ok: true });
  const reference = typeof event.data?.reference === "string" ? event.data.reference : "";
  if (!reference) return NextResponse.json({ error: "Missing transaction reference." }, { status: 400 });

  const result = await verifyAndActivateVendorPayment(reference);
  if (result === "pending") {
    // Ask Paystack to retry when its verification API is temporarily unavailable.
    return NextResponse.json({ error: "Transaction verification is temporarily unavailable." }, { status: 503 });
  }
  if (result === "invalid") return NextResponse.json({ error: "Transaction did not match a pending FindIt payment." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
