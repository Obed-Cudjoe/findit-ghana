import { NextResponse, type NextRequest } from "next/server";
import { siteBaseUrl, verifyAndActivateVendorPayment } from "@/lib/paystack";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference")?.trim() ?? "";
  const status = reference ? await verifyAndActivateVendorPayment(reference) : "invalid";
  const result = status === "confirmed" ? "success" : status === "pending" ? "pending" : "failed";
  return NextResponse.redirect(new URL(`/payment/result?status=${result}`, siteBaseUrl()));
}
