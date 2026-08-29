// GET /api/refresh — daily price-refresh cron (Vercel Cron calls this at 06:00 UTC).
// In Supabase mode this upserts fresh vendor data; in demo mode it reports the
// catalogue snapshots the site is serving.
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseMode } from "@/lib/store";
import { jumiaProducts, jumiaOffers, jumiaCatalogMeta } from "@/lib/feeds/jumia";
import { compughanaProducts, compughanaOffers } from "@/lib/feeds/compughana";
import { frankoProducts, frankoOffers } from "@/lib/feeds/franko";
import { telefonikaProducts, telefonikaOffers } from "@/lib/feeds/telefonika";
import { syncCatalogueToSupabase } from "@/lib/feeds/sync";

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
    // Production path: push the live catalogue into Supabase (stable ids,
    // idempotent) and record today's price snapshot per offer. Snapshots
    // accumulate daily → powers the price-history chart and drop badges.
    const result = await syncCatalogueToSupabase();
    return NextResponse.json({
      ok: !result.error,
      mode: "supabase",
      ...result,
      at: new Date().toISOString(),
    });
  }

  const meta = jumiaCatalogMeta();
  const jumia = jumiaProducts().length;
  const compughana = compughanaProducts().length;
  const franko = frankoProducts().length;
  const telefonika = telefonikaProducts().length;
  return NextResponse.json({
    ok: true,
    mode: "demo",
    source: meta.source,
    catalogFetchedAt: meta.fetchedAt,
    products: jumia + compughana + franko + telefonika,
    offers: jumiaOffers().length + compughanaOffers().length + frankoOffers().length + telefonikaOffers().length,
    sources: {
      "jumia.com.gh": jumia,
      "compughana.com": compughana,
      "frankotrading.com": franko,
      "telefonika.com": telefonika,
    },
    snapshots: 0,
    staleDeactivated: 0,
    note: "Refresh Jumia prices by running scripts/fetch-jumia.mjs. Partner catalogues (CompuGhana, Franko Trading, Telefonika) are committed snapshots in data/*-catalog.json.",
    at: new Date().toISOString(),
  });
}
