// Admin-only: list actual-price submissions (moderation queue for COMP-19).
// Auth is enforced by middleware for /api/admin/*.
import { NextResponse } from "next/server";
import { readActualPrices } from "@/lib/store";

export async function GET() {
  const rows = await readActualPrices();
  return NextResponse.json({ rows });
}
