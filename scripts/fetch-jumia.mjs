#!/usr/bin/env node
// scripts/fetch-jumia.mjs — refresh the real Jumia Ghana catalogue snapshot.
//
//   node scripts/fetch-jumia.mjs            # scrape the default categories
//   node scripts/fetch-jumia.mjs --url=https://www.jumia.com.gh/smartphones/?page=2 --category=phones
//   DEBUG_JUMIA=1 node scripts/fetch-jumia.mjs   # diagnose failures
//
// Writes data/jumia-catalog.json (the file lib/feeds/jumia.ts serves to the
// site). Run from any machine with normal internet access; commit the result.
//
// Scraping etiquette: one request per category page, a small delay between
// requests, and only listing-page data (names, prices, URLs, card images) —
// no product-page crawl.
//
// MERGE MODE: the existing snapshot is the source of truth for curated
// product names (and any photo a card didn't expose this run). A refresh
// updates prices/discounts/ratings/images and adds/removes products, but
// never rewrites the display names you've curated.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "data", "jumia-catalog.json");

// One Jumia GH listing page per site category (first page of each).
const DEFAULT_PAGES = [
  ["phones", "https://www.jumia.com.gh/smartphones/"],
  ["laptops", "https://www.jumia.com.gh/laptops/"],
  ["tv-audio", "https://www.jumia.com.gh/televisions/"],
  ["tv-audio", "https://www.jumia.com.gh/home-audio-electronics/"],
  ["appliances", "https://www.jumia.com.gh/appliances-fridges-freezers/"],
  ["appliances", "https://www.jumia.com.gh/washers-dryers-washers/"],
  ["gaming", "https://www.jumia.com.gh/playstation-5/"],
  ["fashion", "https://www.jumia.com.gh/smart-watches/"],
];

// Browser-grade headers: Jumia's CDN serves bot-check pages to unknown
// user-agents, which is what blanked an earlier run. Light, polite scraping
// with normal browser headers + delays is what keeps this working.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const onlyUrl = args.find((a) => a.startsWith("--url="))?.slice(6);
const forcedCategory = args.find((a) => a.startsWith("--category="))?.slice(11);
const DEBUG = !!process.env.DEBUG_JUMIA;

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGhs(text) {
  // "GH₵ 1 585" | "GH₡ 2,211" (Jumia's HTML entity renders a colon sign) → number
  const m = text.replace(/,/g, "").match(/GH[^0-9]{0,6}\s*([\d ]+\d)/);
  if (!m) return null;
  const n = Number(m[1].replace(/\s+/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Extract product cards from a Jumia listing page's HTML. Tolerant by design:
// any anchor to a product page qualifies as a card candidate; the name
// (<h3 class="name">) + price (<div class="prc">) requirement is the real
// filter — banner and utility links never carry both.
function extractProducts(html, fallbackCategory) {
  const products = [];
  const seen = new Set();
  const anchorRe = /<a\b[^>]*href="(\/[^"]*?\.html)"[^>]*>/g;
  const priceRe = /class="prc[^"]*"[^>]*>([\s\S]{0,200}?)<\/div>/;
  const nameRe = /class="name"[^>]*>([\s\S]{0,300}?)<\/h3>/;
  const ratingRe = /class="rev[^"]*"[^>]*>\s*([\d.]+)\s*(?:out of|\/)\s*5/i;
  const reviewsRe = /\((\d+)\)/;

  let m;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    const tail = html.slice(m.index, m.index + 4000); // card scope
    const name = tail.match(nameRe)?.[1];
    // Decode entities before price parsing: Jumia renders the cedi sign as
    // an HTML entity (GH&#8353;), which would otherwise break the match.
    const priceBlock = decodeEntities(tail.match(priceRe)?.[1] ?? "");
    if (!name || !priceBlock) continue;

    const url = `https://www.jumia.com.gh${href}`;
    if (seen.has(url)) continue;

    // Price = first GH₵ figure. (Tolerant of whichever currency glyph.)
    const figures = [...priceBlock.matchAll(/GH[^0-9]{0,6}\s*([\d][\d ,]*)/g)]
      .map((x) => parseGhs(x[0]))
      .filter((x) => x !== null);
    const priceGhs = figures[0];
    if (!priceGhs) continue;

    // Old price lives in its own <div class="old"> inside the card scope.
    const oldRaw = tail.match(/class="old"[^>]*>([\s\S]{0,120}?)<\/div>/)?.[1];
    const oldPriceGhs = oldRaw ? parseGhs(decodeEntities(oldRaw)) : undefined;
    const discountPct = Number(tail.match(/_dsct[^>]*>\s*(\d{1,2})%/)?.[1]) || undefined;

    const ratingMatch = tail.match(ratingRe);
    const rating = ratingMatch ? Number(ratingMatch[1]) : undefined;
    const reviews = ratingMatch ? Number(tail.match(reviewsRe)?.[1]) || undefined : undefined;

    // Card photo: the listing card's <img> pointing at the marketplace CDN.
    const image = tail.match(/<img[^>]+(?:data-src|src)="(https:\/\/[^"]*?jumia\.is\/[^"]*?\/product\/[^"]+)"/i)?.[1];

    seen.add(url);
    products.push({
      name: decodeEntities(name),
      brand: decodeEntities(name).split(/[\s–-]/)[0] || "Generic",
      category: fallbackCategory,
      url,
      ...(image ? { image } : {}),
      priceGhs,
      ...(oldPriceGhs ? { oldPriceGhs } : {}),
      ...(discountPct ? { discountPct } : {}),
      ...(rating ? { rating, reviews } : {}),
    });
  }
  return products;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
  const pages = onlyUrl ? [[forcedCategory ?? "phones", onlyUrl]] : DEFAULT_PAGES;

  const collected = [];
  for (const [category, url] of pages) {
    process.stdout.write(`fetching ${category.padEnd(11)} ${url} … `);
    try {
      const html = await fetchPage(url);
      const found = extractProducts(html, category);
      console.log(`${found.length} products`);
      collected.push(...found);

      if (found.length === 0 && DEBUG) {
        const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "(no title)";
        const anchors = (html.match(/href="\/[^"]*?\.html"/g) ?? []).length;
        const cores = (html.match(/class="[^"]*\bcore\b/g) ?? []).length;
        const botCheck = /captcha|robot|access denied|unusual traffic|are you a human/i.test(html);
        console.log(`  [debug] title: ${title}`);
        console.log(`  [debug] anchors to .html: ${anchors} | class~=core: ${cores} | bot-check page: ${botCheck}`);
        fs.writeFileSync(`debug-${category}.html`, html);
        console.log(`  [debug] raw page saved to debug-${category}.html — open it and check what Jumia returned`);
      }
    } catch (err) {
      console.log(`FAILED (${err.message})`);
    }
    await sleep(1500);
  }

  // De-duplicate by URL, keep first occurrence.
  const byUrl = new Map();
  for (const p of collected) if (!byUrl.has(p.url)) byUrl.set(p.url, p);
  const products = [...byUrl.values()];

  // Merge with the existing snapshot: curated names (and any previously
  // captured photo) survive every refresh; prices/stock data come fresh.
  let previous = null;
  try {
    previous = JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    previous = null;
  }
  const prevByUrl = new Map((previous?.products ?? []).map((p) => [p.url, p]));
  for (const p of products) {
    const old = prevByUrl.get(p.url);
    if (!old) continue;
    if (old.name) p.name = old.name;
    if (old.brand) p.brand = old.brand;
    if (!p.image && old.image) p.image = old.image;
  }

  if (products.length === 0) {
    console.error("\nNo products parsed. Run with DEBUG_JUMIA=1 against a single category to see what Jumia returned:");
    console.error('  DEBUG_JUMIA=1 node scripts/fetch-jumia.mjs --url="https://www.jumia.com.gh/smartphones/" --category=phones');
    process.exit(1);
  }

  const doc = {
    source: "jumia.com.gh",
    description:
      "Real Jumia Ghana catalogue snapshot. Prices are live GH₵ listing prices captured from jumia.com.gh category pages on the fetchedAt date. discountPct is the marketplace's own displayed discount badge. Run scripts/fetch-jumia.mjs to refresh.",
    fetchedAt: new Date().toISOString(),
    currency: "GHS",
    deliveryModel:
      "Jumia shows the final delivery fee per address at checkout; marketplace items commonly ship free or for a small location-based fee. Modelled as fee 0 with 'Jumia delivery' 2-5 days.",
    products,
  };

  fs.writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
  const withImages = products.filter((p) => p.image).length;
  console.log(`\nWrote ${products.length} products (${withImages} with photos) → ${path.relative(ROOT, OUT)}`);
  console.log("Next: npm run lint && npm run build, then commit the refreshed snapshot.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
