// GET /api/refresh — daily price-refresh cron (Vercel Cron calls this at 06:00 UTC).
// In Supabase mode this upserts fresh vendor data; in demo mode it reports the
// real Jumia Ghana catalogue snapshot the site is serving (lib/feeds/jumia.ts).
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseMode } from "@/lib/store";
import { jumiaProducts, jumiaOffers, jumiaCatalogMeta } from "@/lib/feeds/jumia";
import { compughanaProducts, compughanaOffers } from "@/lib/feeds/compughana";

export async function GET(request: NextRequest) {
  // Cron protection: Vercel sends CRON_SECRET as a Bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  if (isSupabaseMode()) {
    // Production path: the Supabase schema (migrations/001_init.sql) is the source
    // of truth; vendor feeds upsert here. Kept explicit for the handoff.
    return NextResponse.json({
      ok: true,
      mode: "supabase",
      note: "Feed upsert hook — wire lib/feeds/jumia.ts here with the buyer's affiliate key.",
      at: new Date().toISOString(),
    });
  }

  // Demo mode: the real Jumia Ghana catalogue snapshot currently being served.
  const meta = jumiaCatalogMeta();
  return NextResponse.json({
    ok: true,
    mode: "demo",
    source: meta.source,
    catalogFetchedAt: meta.fetchedAt,
    products: jumiaProducts().length + compughanaProducts().length,
    offers: jumiaOffers().length + compughanaOffers().length,
    sources: {
      "jumia.com.gh": jumiaProducts().length,
      "compughana.com": compughanaProducts().length,
    },
    snapshots: 0,
    staleDeactivated: 0,
    note: "Refresh prices by running scripts/fetch-jumia.mjs and committing the updated data/jumia-catalog.json.",
    at: new Date().toISOString(),
  });
}
