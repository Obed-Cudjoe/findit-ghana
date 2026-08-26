#!/usr/bin/env node
// scripts/announce-price-drops.mjs — announce today's Jumia price drops.
//
// Compares the freshly committed catalogue snapshot with the previous one
// (git), formats the biggest drops, and posts them to a Telegram channel via
// the Bot API. Run inside the daily refresh workflow AFTER the snapshot
// commit, or locally:
//
//   TELEGRAM_BOT_TOKEN=123:abc TELEGRAM_CHAT_ID=@finditghana node scripts/announce-price-drops.mjs
//
// Without the two env vars it just prints the message — copy-paste it into a
// WhatsApp Channel/Status or any group. (WhatsApp has no public post API, so
// Telegram is the automatable channel; WhatsApp stays manual.)
//
// Setup (one time, ~5 minutes):
//   1. Telegram → @BotFather → /newbot → copy the token        → TELEGRAM_BOT_TOKEN
//   2. Create a public channel, add the bot as admin           → TELEGRAM_CHAT_ID (@handle or -100… id)
//   3. GitHub repo → Settings → Secrets and variables → Actions → add both secrets.

import { execSync } from "node:child_process";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://findit-ghana.vercel.app").replace(/\/$/, "");
const MIN_DROP_PCT = 3; // ignore noise
const MAX_ITEMS = 8;

function loadSnapshot(ref) {
  try {
    return JSON.parse(execSync(`git show ${ref}:data/jumia-catalog.json`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }));
  } catch {
    return null;
  }
}

const current = JSON.parse((await import("node:fs")).readFileSync("data/jumia-catalog.json", "utf8"));
// After the refresh workflow's commit, HEAD is today's snapshot and HEAD~1 is
// yesterday's. Locally (uncommitted changes) HEAD is still yesterday's.
const previous = loadSnapshot("HEAD~1") ?? loadSnapshot("HEAD");
if (!previous) {
  console.log("No previous snapshot found — nothing to compare. Skipping.");
  process.exit(0);
}

const before = new Map(previous.products.map((p) => [p.url, p]));
const drops = [];
for (const p of current.products) {
  const old = before.get(p.url);
  if (!old || old.priceGhs <= p.priceGhs) continue;
  const pct = Math.round(((old.priceGhs - p.priceGhs) / old.priceGhs) * 100);
  if (pct < MIN_DROP_PCT) continue;
  const slug = p.url.split("/").pop().replace(/\.html$/i, "");
  drops.push({ name: p.name, brand: p.brand, old: old.priceGhs, now: p.priceGhs, pct, slug });
}
drops.sort((a, b) => b.pct - a.pct);
const top = drops.slice(0, MAX_ITEMS);
if (top.length === 0) {
  console.log("No notable price drops today.");
  process.exit(0);
}

const fmt = (n) => "GH₵" + n.toLocaleString("en-GH");
const lines = top.map(
  (d) => `▼ ${fmt(d.old)} → ${fmt(d.now)} (−${d.pct}%) · ${d.name.slice(0, 60)}`,
);
const message = [
  "🔥 Today's price drops on FindIt Ghana:",
  "",
  ...lines,
  "",
  `Compare all live prices: ${SITE_URL}`,
].join("\n");

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    console.error("Telegram post failed:", res.status, (await res.text()).slice(0, 300));
    process.exit(1);
  }
  console.log(`Posted ${top.length} price drops to Telegram.`);
} else {
  console.log("\n--- Message (no Telegram env vars set — copy-paste manually) ---\n");
  console.log(message);
}
