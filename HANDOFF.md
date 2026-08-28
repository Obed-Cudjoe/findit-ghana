# FindIt Ghana — Handoff & Launch Checklist

Everything a new owner needs to run, secure, and transfer this site safely.
Read this top to bottom before going live or handing over money.

---

## 1. Before launch — required environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (and locally in `.env.local`):

| Variable | Required? | Notes |
|---|---|---|
| `ADMIN_PASSWORD` | **Yes — no default** | Admin login is disabled until set. Use a long unique passphrase. |
| `CRON_SECRET` | **Yes in production** | Bearer token protecting `/api/refresh`. Generate: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your final domain, e.g. `https://findit.com.gh` |
| `NEXT_PUBLIC_JUMIA_AFFILIATE_URL` | Yes (revenue) | Your own Jumia/JForce affiliate link. All buy buttons route through it. |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Strongly recommended | Without these, form submissions (including vendor phone numbers) land in the **public demo store** — the admin dashboard shows a red banner when that happens. |

## 2. Storage of submissions (reports, contact, vendor listings)

Three tiers, automatic (see `lib/store.ts`):

1. **Supabase** — production path. Free tier is enough. Setup: create project → run `supabase/migrations/001_init.sql`, then `002_featured_listings.sql`, then `003_vendor_plans.sql`, then `004_vendor_passwords.sql`, then `005_unlimited_plan.sql`, then `006_listing_images.sql` (product-photo column + public `vendor-images` storage bucket) → add the three env vars. Done.
2. **Local JSON files** — dev machines only.
3. **Public demo store** — Vercel fallback when Supabase is not connected. ⚠ **Publicly readable and writable by anyone.** Fine for a demo, not for a live marketplace. The admin dashboard banner always shows which tier is active.

## 3. Personalising after a sale (seller → buyer)

- [ ] Transfer the **GitHub repo** (Settings → Collaborators → Transfer ownership) and the **Vercel project** (Settings → General → Transfer Project).
- [ ] Point a real **domain** at the Vercel project and update `NEXT_PUBLIC_SITE_URL`.
- [ ] Replace the owner's contact details in **`siteConfig`** (bottom of `lib/data.ts`): email, phone, LinkedIn.
- [ ] Swap in the buyer's **Jumia affiliate link** (`NEXT_PUBLIC_JUMIA_AFFILIATE_URL`).
- [ ] Rotate **`ADMIN_PASSWORD`** and **`CRON_SECRET`** at handoff.
- [ ] GitHub → Settings → Actions: confirm the two workflows are enabled (**Build check**, **Refresh Jumia Ghana catalogue**). The refresh workflow can also be run manually via *Run workflow*.
- [ ] Update logo/name if rebranding: `app/icon.svg`, `siteConfig.name`, footer in `app/layout.tsx`.

## 4. How prices stay fresh

- Catalogues are committed snapshots: `data/jumia-catalog.json` (Jumia Ghana), `data/compughana-catalog.json` (CompuGhana), `data/franko-catalog.json` (Franko Trading), `data/telefonika-catalog.json` (Telefonika).
- A GitHub Action re-scrapes Jumia **daily at 05:20 UTC** and auto-commits changed prices → Vercel redeploys automatically. No secrets needed; it uses the built-in `GITHUB_TOKEN`.
- Manual Jumia refresh anytime: `node scripts/fetch-jumia.mjs`, then commit the diff. Partner catalogues are updated by editing the matching JSON file.
- Product-level price history (12-week chart) activates automatically once the daily `/api/refresh` cron runs in Supabase mode and snapshots accumulate.

## 5. Known limitations (be honest with buyers)

- **Partner catalogues are snapshots, not a live scrape.** Jumia refreshes daily via GitHub Action. CompuGhana, Franko Trading and Telefonika prices are committed listings — update the JSON when their websites change. Catalogue feeds still use per-source slugs; independent vendor listings that name the same product merge onto one page (and onto a matching catalogue product when the titles agree).
- **No email/WhatsApp notifications.** New vendor listings and reports appear in the admin dashboard; nobody is pinged. Wire an email provider into `saveVendorListing`/`saveReport` if wanted.
- **`supabase/seed.sql` is legacy.** It seeds the old demo catalogue into the DB `products`/`offers` tables — the live site serves the JSON snapshot instead and ignores those tables. Only `vendor_listings`, `reports`, `contacts`, `clicks`, `guides` tables matter.
- **Rate limits are per serverless instance** (in-memory). Good spam determent, not a hard guarantee; swap `lib/ratelimit.ts` for Upstash Redis if a buyer needs hard limits.
- **Admin auth is a single shared password** (JWT session cookie, 12h). Fine for one owner; move to Supabase Auth for multi-user teams.
- Ghana **Data Protection Act (Act 843)**: if collecting vendor/buyer data at scale, the operating entity should register with the Data Protection Commission. The privacy page covers site practice, not entity registration.

## 7. Earning from the site

**Vendor plans (built in).** Shops register and pick a plan on `/for-vendors` (shop details only — no product fields), then list products from their dashboard at `/vendor/listings`:

| Plan | Price | Listings | Placement |
|---|---|---|---|
| Free | GH₵0 | 3 | Search + category |
| Starter | GH₵50/month | up to 10 | ★ featured rotation in their category |
| Pro | GH₵150/month | up to 25 | Homepage featured shop + category ★ + click/view stats |
| Unlimited | GH₵300/month | Unlimited | ∞ Unlimited badge on shop + every product, **ranked above every other vendor** (including featured/official) in search and category results, homepage featured shop, click/view stats |

Flow: vendor registers the shop on `/for-vendors` (lands in `/admin/vendors` as pending, nothing in the listings queue) → signs in at `/vendor` → adds products on `/vendor/listings` with 3–6 photos each, up to the plan cap → each product goes to `/admin/listings` for approval.

Paid flow: vendor picks a paid plan at signup → pays MoMo to **053 126 2424** → WhatsApps the reference → you confirm on **`/admin/vendors`** → **MoMo → Starter 30d**, **MoMo → Pro 30d** or **MoMo → Unlimited 30d** (sets plan + 30-day expiry). Directory: `/vendors` and `/vendors/[slug]`. Vendor login: **`/vendor`** (cookie `findit_vendor`, 12h). Same-named products from different shops merge onto one product page (vendor comparison table). If you use Supabase, run `003_vendor_plans.sql`, then `004_vendor_passwords.sql`, then `005_unlimited_plan.sql`, then `006_listing_images.sql` after 001 and 002. Optional `VENDOR_JWT_SECRET` (falls back to `ADMIN_PASSWORD`). **Product photos (3–6 per listing)** upload to the public `vendor-images` storage bucket in Supabase mode, to `public/uploads/` on a dev machine, and are refused (with a clear message) on the public demo store — so photos need Supabase to work on a live Vercel deploy.

Per-listing **"★ Feature 30d"** on `/admin/listings` still works as an extra pin (`featured_until`).

**Daily price-drop channel (built in).** `scripts/announce-price-drops.mjs` compares today's catalogue with yesterday's and posts the biggest drops. The refresh workflow runs it automatically **if** you add two repo secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — setup steps at the top of the script). Without secrets, run it locally and it prints a copy-paste message for WhatsApp Channels/groups. The message links to the site, which carries the affiliate links — channel → site → Jumia.

**Affiliate commissions.** Already live on every buy button. Track outbound clicks in the admin overview; plug `NEXT_PUBLIC_GA_ID` for funnel detail.

## 8. Quick ops commands

```bash
npm run dev            # local dev on :3000
npm run lint           # type-check (tsc)
npm run build          # production build (also runs in CI on every push)
node scripts/fetch-jumia.mjs   # manual catalogue refresh
node scripts/announce-price-drops.mjs   # preview/post today's drops
```
