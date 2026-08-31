#!/usr/bin/env node
// scripts/fetch-partners.mjs — refresh the partner shop catalogues
// (CompuGhana, Telefonika, Franko Trading) that sit beside Jumia.
//
//   node scripts/fetch-partners.mjs            # refresh all three
//   node scripts/fetch-partners.mjs --only=compughana   # just one
//   DEBUG_PARTNERS=1 node scripts/fetch-partners.mjs     # diagnose
//
// How it works per partner:
//   - CompuGhana & Telefonika are Shopify stores with a public
//     /products.json endpoint (250 products per page). We read that —
//     far more robust than scraping listing HTML, and it carries real
//     variant prices, availability and images.
//   - Franko Trading serves a JavaScript SPA (its /products.json and
//     product pages all return the same HTML shell), so there is nothing
//     to parse. The script detects this and SKIPS Franko, leaving the
//     committed snapshot untouched — same "never break what exists"
//     rule as the Jumia script.
//
// Output files (same shape lib/feeds/*.ts already consume):
//   data/compughana-catalog.json · data/telefonika-catalog.json
//   (and data/franko-catalog.json when its API becomes reachable)
//
// Scraping etiquette: one request per page, 800ms delay, listing data only.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DEBUG = !!process.env.DEBUG_PARTNERS;
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7) ?? null;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Category mapping — the site's six slugs, driven by what Ghanaian shoppers
// search on these shops. Products matching nothing are skipped (never
// mis-filed), and the skip count is reported.
// ---------------------------------------------------------------------------
const CATEGORY_RULES = [
  ["phones", /phone|iphone|galaxy\s|smartphone|redmi|tecno|infinix|itel|nokia|oppo|vivo|xiaomi|pixel\s|realme/i],
  ["laptops", /laptop|notebook|macbook|chromebook|thinkpad|ideapad|pavilion|vostro|inspiron/i],
  ["tv-audio", /\btv\b|television|soundbar|speaker|earbuds|earphone|headphone|headset|airpods|home\s?theat/i],
  ["appliances", /fridge|freezer|refrigerator|washing|washer|dryer|cooker|microwave|blender|kettle|air\s?cond|dispenser|water\s?heater/i],
  ["gaming", /playstation|\bps5\b|\bps4\b|xbox|nintendo|gamepad|console|controller/i],
  ["fashion", /watch|smartwatch|fitbit|band\b|sunglass|shoe|sneaker/i],
];

function categoryFor(title, productType = "") {
  const hay = `${title} ${productType}`;
  for (const [slug, re] of CATEGORY_RULES) {
    if (re.test(hay)) return slug;
  }
  return null;
}

function brandFor(vendor, title) {
  if (vendor && vendor.trim()) return vendor.trim();
  return title.split(/[\s–-]/)[0] || "Generic";
}

function parsePrice(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// ---------------------------------------------------------------------------
// Shopify products.json reader — paginated, tolerant.
// ---------------------------------------------------------------------------
async function fetchShopifyProducts(host, label) {
  const all = [];
  for (let page = 1; page <= 12; page++) {
    const url = `https://${host}/products.json?limit=250&page=${page}`;
    process.stdout.write(`  ${label} page ${page} … `);
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      break;
    }
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      break;
    }
    const body = await res.json();
    const products = body?.products ?? [];
    console.log(`${products.length} products`);
    if (products.length === 0) break;
    all.push(...products);
    if (products.length < 250) break;
    await sleep(800);
  }
  return all;
}

function mapShopifyProduct(p, host) {
  const title = String(p.title ?? "").trim();
  if (!title) return null;
  const category = categoryFor(title, p.product_type ?? "");
  if (!category) return { skipped: true };

  const variant = (p.variants ?? []).find((v) => v.available) ?? (p.variants ?? [])[0];
  if (!variant) return { skipped: true };
  const priceGhs = parsePrice(variant.price);
  if (priceGhs === null) return { skipped: true };

  const image = (p.images ?? [])[0]?.src ?? undefined;
  const entry = {
    name: title,
    brand: brandFor(p.vendor, title),
    category,
    url: `https://${host}/products/${p.handle}`,
    priceGhs,
    ...(image ? { image } : {}),
  };
  // compare_at_price → oldPriceGhs/discountPct (same fields the feeds use)
  if (variant.compare_at_price) {
    const old = parsePrice(variant.compare_at_price);
    if (old && old > priceGhs) {
      entry.oldPriceGhs = old;
      entry.discountPct = Math.round(((old - priceGhs) / old) * 100);
    }
  }
  return { entry };
}

function loadExisting(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "data", file), "utf8"));
  } catch {
    return null;
  }
}

function saveCatalog(file, doc) {
  fs.writeFileSync(path.join(ROOT, "data", file), JSON.stringify(doc, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
const PARTNERS = [
  { id: "compughana", host: "compughana.com", file: "compughana-catalog.json", label: "CompuGhana" },
  { id: "telefonika", host: "telefonika.com", file: "telefonika-catalog.json", label: "Telefonika" },
  { id: "franko", host: "www.frankotrading.com", file: "franko-catalog.json", label: "Franko Trading" },
];

async function main() {
  const targets = only ? PARTNERS.filter((p) => p.id === only) : PARTNERS;
  if (targets.length === 0) {
    console.error(`Unknown partner: ${only}. Use one of: ${PARTNERS.map((p) => p.id).join(", ")}`);
    process.exit(1);
  }

  let refreshed = 0;
  for (const partner of targets) {
    console.log(`\n=== ${partner.label} (${partner.host}) ===`);
    const existing = loadExisting(partner.file);

    const shopify = await fetchShopifyProducts(partner.host, partner.label);
    if (shopify.length === 0) {
      console.log(`  → no JSON API (${partner.label} likely serves an SPA). Snapshot untouched.`);
      if (DEBUG && partner.id === "franko") {
        const res = await fetch(`https://${partner.host}/products.json`, { headers: { "User-Agent": UA } });
        const html = await res.text();
        console.log(`  [debug] status ${res.status}, bytes ${html.length}, looks-like-html ${/<html/i.test(html)}`);
      }
      continue;
    }

    // Map + classify
    const entries = [];
    let skipped = 0;
    for (const p of shopify) {
      const mapped = mapShopifyProduct(p, partner.host);
      if (!mapped || mapped.skipped) { skipped++; continue; }
      entries.push(mapped.entry);
    }

    // Merge mode: curated names (and any photo) in the existing snapshot
    // survive a refresh; prices/stock come fresh. Same rule as fetch-jumia.
    const prevByUrl = new Map((existing?.products ?? []).map((p) => [p.url, p]));
    const products = entries.map((e) => {
      const old = prevByUrl.get(e.url);
      if (!old) return e;
      return { ...e, name: old.name, ...(old.image && !e.image ? { image: old.image } : {}) };
    });

    const doc = {
      source: existing?.source ?? `https://${partner.host}/`,
      description: existing?.description ?? `Live catalogue snapshot for ${partner.label}.`,
      fetchedAt: new Date().toISOString(),
      currency: "GHS",
      deliveryModel: existing?.deliveryModel ?? {},
      products,
    };
    saveCatalog(partner.file, doc);
    refreshed++;
    console.log(`  → wrote ${products.length} products (${skipped} skipped — no matching category)`);
  }

  console.log(`\nDone. Refreshed ${refreshed} of ${targets.length} partner catalogue(s).`);
  if (refreshed < targets.length) {
    console.log("Skipped partners keep their committed snapshot — nothing was overwritten.");
  }
}

main().catch((err) => {
  console.error("fatal:", err.message);
  process.exit(1);
});
