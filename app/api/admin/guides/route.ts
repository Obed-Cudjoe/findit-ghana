// POST /api/admin/guides — content editor save (P24).
// Demo mode: writes overrides to data/submissions/guides-overrides.json,
// merged over the seed guides on read (see lib/data.ts).
// Supabase mode: upserts into the guides table.
import { NextResponse, type NextRequest } from "next/server";
import { saveGuideOverride } from "@/lib/store";

export async function POST(request: NextRequest) {
  const { slug, excerpt, body } = (await request.json().catch(() => ({}))) as { slug?: string; excerpt?: string; body?: string };
  if (!slug || typeof excerpt !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "Missing slug, excerpt or body." }, { status: 400 });
  }
  if (body.trim().length < 20) {
    return NextResponse.json({ error: "Body is too short to publish." }, { status: 400 });
  }
  const ok = await saveGuideOverride({ slug, excerpt: excerpt.trim(), body });
  if (!ok) return NextResponse.json({ error: "Could not save." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
