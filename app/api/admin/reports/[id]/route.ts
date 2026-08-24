// Admin-only: update a report's status (P22 queue actions).
import { NextResponse, type NextRequest } from "next/server";
import { updateReportStatus } from "@/lib/store";

const VALID = ["new", "checking", "fixed", "dismissed"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (!status || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  const ok = await updateReportStatus(id, status as (typeof VALID)[number]);
  if (!ok) return NextResponse.json({ error: "Report not found or store unavailable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
