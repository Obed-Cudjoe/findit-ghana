import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { setCommunityMarketListingStatus } from "@/lib/community-market";
import type { CommunityListingStatus } from "@/lib/community-market-categories";

const ALLOWED = new Set<CommunityListingStatus>(["approved", "rejected", "sold"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const status = body.status as CommunityListingStatus;
  if (!ALLOWED.has(status)) return NextResponse.json({ error: "Choose a valid listing status." }, { status: 400 });
  const ok = await setCommunityMarketListingStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Could not update the listing." }, { status: 500 });
  revalidatePath("/community-market");
  revalidatePath("/admin/community-market");
  return NextResponse.json({ ok: true, status });
}
