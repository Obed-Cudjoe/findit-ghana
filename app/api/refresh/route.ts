// GET /api/refresh — daily price-refresh cron (Vercel Cron calls this at 06:00 UTC).
// In Supabase mode this upserts fresh vendor data; in demo mode it reports the
// catalogue snapshots the site is serving.
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseMode, readPriceAlerts, updatePriceAlertStatus } from "@/lib/store";
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
    // idempotent), record today's price snapshot per offer, then check the
    // price-drop alert watchlist against today's lowest prices.
    const result = await syncCatalogueToSupabase();
    let alertsTriggered = 0;
    if (!result.error) {
      const alerts = (await readPriceAlerts()).filter((a) => a.status === "active");
      for (const alert of alerts) {
        const current = result.prices[alert.productSlug];
        if (current !== undefined && current <= alert.targetPriceGhs) {
          const ok = await updatePriceAlertStatus(alert.id, "triggered");
          if (ok) alertsTriggered += 1;
        }
      }
    }
    return NextResponse.json({
      ok: !result.error,
      mode: "supabase",
      ...result,
      alertsTriggered,
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
