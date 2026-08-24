// POST /api/reports — price/stock/suspicious reports (P13 + P14 forms).
// Validates, stores (Supabase or demo JSON), returns the reference code.
import { NextResponse, type NextRequest } from "next/server";
import { saveReport } from "@/lib/store";

const VALID_KINDS = ["price_error", "stock_error", "delivery_error", "other", "suspicious"] as const;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  const listingUrl = typeof body.listingUrl === "string" ? body.listingUrl.trim() : "";
  const vendorName = typeof body.vendorName === "string" ? body.vendorName.trim() : "";
  const detail = typeof body.detail === "string" ? body.detail.trim() : "";
  const reporterEmail = typeof body.reporterEmail === "string" ? body.reporterEmail.trim() : "";

  if (!VALID_KINDS.includes(kind as (typeof VALID_KINDS)[number])) {
    return NextResponse.json({ error: "Choose what's wrong before sending." }, { status: 400 });
  }
  if (listingUrl.length < 5) {
    return NextResponse.json({ error: "Add the listing link." }, { status: 400 });
  }
  if (detail.length < 10) {
    return NextResponse.json({ error: "Describe what happened (at least 10 characters)." }, { status: 400 });
  }
  if (reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { ok, refCode } = await saveReport({
    kind: kind as (typeof VALID_KINDS)[number],
    listingUrl,
    vendorName,
    detail,
    reporterEmail,
  });

  if (!ok) {
    return NextResponse.json({ error: "Could not store the report. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, refCode });
}
