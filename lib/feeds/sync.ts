// lib/feeds/sync.ts — pushes the live catalogue (Jumia + 3 partner shops)
// into Supabase and records a daily price snapshot per offer.
//
// Called by GET /api/refresh (the daily Vercel cron) when Supabase is
// configured. In demo mode it is never called. Idempotent by design:
// stable UUIDs per vendor/product/offer mean re-running is safe.
//
// Snapshots are what make two features real over time:
//   1. The 12-week price-history chart on product pages
//   2. "Price dropped ▼" badges (appear automatically once a snapshot
//      shows a lower price than the previous day's observation)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { jumiaProducts, jumiaOffers, jumiaVendor } from "@/lib/feeds/jumia";
import { compughanaProducts, compughanaOffers, compughanaVendor } from "@/lib/feeds/compughana";
import { frankoProducts, frankoOffers, frankoVendor } from "@/lib/feeds/franko";
import { telefonikaProducts, telefonikaOffers, telefonikaVendor } from "@/lib/feeds/telefonika";

// Deterministic UUIDv4-format id from a stable seed — upserts stay idempotent.
function stableUuid(seed: string): string {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${"89ab"[parseInt(hash[16], 16) % 4]}${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

interface SyncResult {
  vendors: number;
  products: number;
  offers: number;
  snapshots: number;
  error?: string;
}

export async function syncCatalogueToSupabase(): Promise<SyncResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { vendors: 0, products: 0, offers: 0, snapshots: 0 };

  const sb: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  const sources = [
    { vendor: jumiaVendor, products: jumiaProducts(), offers: jumiaOffers() },
    { vendor: compughanaVendor, products: compughanaProducts(), offers: compughanaOffers() },
    { vendor: frankoVendor, products: frankoProducts(), offers: frankoOffers() },
    { vendor: telefonikaVendor, products: telefonikaProducts(), offers: telefonikaOffers() },
  ];

  // 1. Upsert the four named vendors (the "verified shops").
  const vendorRows = sources.map((s) => ({
    id: stableUuid(`vendor:${s.vendor.slug}`),
    name: s.vendor.name,
    slug: s.vendor.slug,
    verified: s.vendor.verified,
    source: s.vendor.source,
    external_id: s.vendor.slug,
  }));
  const { error: vendorErr } = await sb.from("vendors").upsert(vendorRows, { onConflict: "slug" });
  if (vendorErr) return { vendors: 0, products: 0, offers: 0, snapshots: 0, error: vendorErr.message };

  // 2. Upsert products (stable id per source-prefixed slug).
  const productRows = sources.flatMap((s) =>
    s.products.map((p) => ({
      id: stableUuid(`product:${p.id}`),
      name: p.name,
      slug: p.slug,
      category: p.category,
      brand: p.brand || null,
      image_url: (p as { image?: string }).image || null,
      specs: p.specs || {},
      canonical_affiliate_url: p.canonicalUrl || null,
      source: "catalogue",
      source_id: p.id,
      updated_at: new Date().toISOString(),
    }))
  );
  const { error: productErr } = await sb.from("products").upsert(productRows, { onConflict: "slug" });
  if (productErr) return { vendors: vendorRows.length, products: 0, offers: 0, snapshots: 0, error: productErr.message };

  // 3. Upsert offers (stable id; FK to vendor + product by stable ids).
  const offerRows = sources.flatMap((s) =>
    s.offers.map((o) => ({
      id: stableUuid(`offer:${o.id}`),
      product_id: stableUuid(`product:${(s.products.find((p) => p.slug === o.productSlug) || s.products[0]).id}`),
      vendor_id: stableUuid(`vendor:${s.vendor.slug}`),
      price_ghs: o.priceGhs,
      stock_count: o.stockCount,
      delivery_zone: o.deliveryZone,
      delivery_days_min: o.deliveryDaysMin,
      delivery_days_max: o.deliveryDaysMax,
      delivery_fee_ghs: o.deliveryFeeGhs,
      affiliate_url: o.affiliateUrl,
      last_checked_at: new Date().toISOString(),
      is_active: true,
    }))
  );
  const { error: offerErr } = await sb.from("price_offers").upsert(offerRows, { onConflict: "id" });
  if (offerErr) return { vendors: vendorRows.length, products: productRows.length, offers: 0, snapshots: 0, error: offerErr.message };

  // 4. Record one snapshot per offer — today's price observation. History
  // accumulates daily, which powers the price-history chart and drop badges.
  const now = new Date().toISOString();
  const snapshotRows = offerRows.map((o) => ({
    offer_id: o.id,
    price_ghs: o.price_ghs,
    captured_at: now,
  }));
  const { error: snapErr } = await sb.from("price_snapshots").insert(snapshotRows);
  if (snapErr) return { vendors: vendorRows.length, products: productRows.length, offers: offerRows.length, snapshots: 0, error: snapErr.message };

  return {
    vendors: vendorRows.length,
    products: productRows.length,
    offers: offerRows.length,
    snapshots: snapshotRows.length,
  };
}
