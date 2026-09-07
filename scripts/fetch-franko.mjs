#!/usr/bin/env node
// scripts/fetch-franko.mjs — refresh the Franko Trading catalogue from its
// real backend API (reverse-engineered from the frankotrading.com web app).
//
//   node scripts/fetch-franko.mjs
//   DEBUG_FRANKO=1 node scripts/fetch-franko.mjs
//
// Where the data comes from:
//   Franko's storefront is a React SPA whose own bundle calls
//     GET https://02yo3gbfxe.execute-api.us-east-1.amazonaws.com/default/FrankoAPI/
//         ?client=website&endpoint=/Category/Category-Get          (categories)
//         ?client=website&endpoint=/Product/Product-Get-by-Category/{uuid}
//   with an `Identifier: Franko` header. This script uses the same public
//   endpoints the shop's own website uses — no credentials, no tricks.
//
// Sold-out handling: Franko files out-of-stock products under dedicated
// "Products out of stock" categories — we skip those buckets entirely, so
// FindIt never sends a shopper to a sold-out Franko page.
//
// Writes data/franko-catalog.json (same shape lib/feeds/franko.ts consumes).
// Merge mode: curated names and previously captured photos survive a refresh;
// prices, stock availability and new products come fresh.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "data", "franko-catalog.json");

const API = "https://02yo3gbfxe.execute-api.us-east-1.amazonaws.com/default/FrankoAPI/";
const HEADERS = { Identifier: "Franko" };

// Franko category name -> FindIt site category.
const CATEGORY_MAP = {
  Phones: "phones",
  Computers: "laptops",
  Television: "tv-audio",
  Speakers: "tv-audio",
  Fridge: "appliances",
  "Washing Machine": "appliances",
  "Home Appliances": "appliances",
  "Air conditioners": "appliances",
  Generator: "appliances",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiGet(endpoint) {
  const url = `${API}?${new URLSearchParams({ client: "website", endpoint })}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${endpoint}`);
  return res.json();
}

function imageUrl(windowsPath) {
  if (!windowsPath) return undefined;
  const file = windowsPath.replace(/\\/g, "/").split("/").pop();
  if (!file) return undefined;
  return `https://testing.frankotrading.com/Media/Products_Images/${encodeURIComponent(file)}`;
}

async function main() {
  const categories = await apiGet("/Category/Category-Get");
  const live = categories.filter(
    (c) => CATEGORY_MAP[c.categoryName] && !/out of stock/i.test(c.categoryName ?? ""),
  );

  console.log(`Franko: ${live.length} live categories, ${categories.length - live.length} out-of-stock buckets skipped\n`);

  const entries = [];
  for (const cat of live) {
    const products = await apiGet(`/Product/Product-Get-by-Category/${cat.categoryId}`);
    let usable = 0;
    for (const p of products ?? []) {
      const name = (p.productName ?? "").trim();
      const priceGhs = Number(p.price);
      if (!name || !Number.isFinite(priceGhs) || priceGhs <= 0) continue;
      if (!p.productID) continue;

      const oldPriceGhs = Number(p.oldPrice) > priceGhs ? Number(p.oldPrice) : undefined;
      const entry = {
        name,
        brand: p.brandName || name.split(/[\s–-]/)[0] || "Franko",
        category: CATEGORY_MAP[cat.categoryName],
        url: `https://www.frankotrading.com/product/${p.productID}`,
        priceGhs,
        ...(oldPriceGhs ? { oldPriceGhs, discountPct: Math.round(((oldPriceGhs - priceGhs) / oldPriceGhs) * 100) } : {}),
        ...(imageUrl(p.productImage) ? { image: imageUrl(p.productImage) } : {}),
      };
      entries.push(entry);
      usable++;
    }
    console.log(`  ${cat.categoryName.padEnd(18)} → ${usable} products`);
    await sleep(800);
  }

  // Merge mode: curated names + photos from the previous snapshot survive.
  let previous = null;
  try {
    previous = JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    previous = null;
  }
  const prevByUrl = new Map((previous?.products ?? []).map((p) => [p.url, p]));
  const seen = new Set();
  const products = [];
  for (const e of entries) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    const old = prevByUrl.get(e.url);
    products.push(
      old
        ? { ...e, name: old.name, brand: old.brand || e.brand, ...(old.image && !e.image ? { image: old.image } : {}) }
        : e,
    );
  }

  const doc = {
    source: "frankotrading.com",
    description:
      "Franko Trading live catalogue — real products and GH₵ prices fetched from the same API franko's own website uses. Sold-out buckets are excluded at fetch time.",
    fetchedAt: new Date().toISOString(),
    currency: "GHS",
    deliveryModel: "Franko Trading advertises free delivery within Accra and Kumasi, and ships nationwide.",
    products,
  };

  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
  const withImages = products.filter((p) => p.image).length;
  console.log(`\nWrote ${products.length} Franko products (${withImages} with photos) → ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error("Franko fetch failed:", err.message);
  process.exit(1);
});
