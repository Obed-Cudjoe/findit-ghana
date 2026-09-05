// Admin-only: approve or hide an actual-price submission.
import { NextResponse, type NextRequest } from "next/server";
import { updateActualPriceStatus } from "@/lib/store";

const VALID = ["new", "approved", "hidden"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!status || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await updateActualPriceStatus(id, status as (typeof VALID)[number]);
  if (!ok) return NextResponse.json({ error: "Not found or store unavailable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
