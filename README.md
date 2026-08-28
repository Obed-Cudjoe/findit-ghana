# FindIt Ghana — Ghana's Price Finder

**A complete, ready-to-sell website that compares live prices in cedis from named vendors across Ghana.**

## 🌐 Live site

**[https://findit-ghana.vercel.app](https://findit-ghana.vercel.app)**

Everything below explains what the site is and how to run or deploy it — but the site itself is already live at the link above, works on any device, and auto-updates on every push to this repository.

---

## What this website is (for buyers and non-technical readers)

FindIt Ghana answers Ghana's most common shopping question in one search: **"where can I find it, what does it really cost, and can I trust the seller?"**

A shopper types a product — *"iphone 13"*, *"gas cooker"*, *"ps5"* — and instantly sees:

- **Real prices in cedis** (GH₵), never dollars, never "call for price"
- **Which named vendors have it in stock**, and how many units
- **Delivery time and delivery fee next to the price** — the total is visible before they click
- **A last-checked timestamp on every listing** — freshness they can verify
- **A 12-week price history chart** so they know if a "deal" is actually a deal

The site never takes payments and never holds stock. It shows the honest picture and routes the shopper to the vendor. Revenue comes from affiliate links (Jumia pays ~9% per sale in Ghana) and featured vendor placements.

**Every page is finished:** home, search, 100+ real product pages (Jumia Ghana plus CompuGhana, Franko Trading and Telefonika), 6 category pages, price guides, trust & methodology, about, contact, two working report forms, privacy/terms, and a password-protected admin dashboard with a corrections queue and content editor.

---

## How to run it locally (5 minutes)

You need **Node.js 20+** installed (free from nodejs.org). Then:

```bash
# 1. clone the repository
git clone <your-repo-url> findit-ghana
cd findit-ghana

# 2. install dependencies
npm install

# 3. (optional) copy the environment template
cp .env.example .env.local

# 4. start the site
npm run dev
```

Then open **http://localhost:3000** **on that same computer** — the site loads locally, seeded with real GH₵ catalogues from Jumia Ghana, CompuGhana, Franko Trading and Telefonika, plus 4 guides.

> ⚠️ `localhost:3000` only works on the machine running the command (it's your own computer's address, not a public link). If you want to see the public site instead, open **https://findit-ghana.vercel.app**.

### Admin dashboard

Visit **/admin** and sign in with the password from the `ADMIN_PASSWORD` environment variable — there is **no default**; until you set one (locally in `.env.local`, or in Vercel → Settings → Environment Variables) admin login is disabled. The dashboard shows:

- **Overview** — open corrections, suspicious reports, outbound clicks tracked
- **Corrections & reports** — every form submission, with one-click actions (Check / Fixed / Dismiss)
- **Vendor listings** — approve/reject self-listed products, optional ★ Feature 30d
- **Vendors & plans** — confirm MoMo, set Free / Starter / Pro / Unlimited (30-day expiry), listing counts and click/view stats
- **Content editor** — edit guide excerpts and bodies, saved instantly

### Where form submissions go

Forms (contact, price reports, suspicious reports) **really store data**:

- **Demo mode (default):** submissions are appended to JSON files in `data/submissions/` on a developer machine. On Vercel (where the filesystem is read-only), demo submissions are persisted to a shared public demo store instead — fine for demos and testing, but public by design.
- **Production mode:** add your Supabase credentials to `.env.local` (see below) and every submission is written to a private free Postgres database automatically. No code changes needed — this is the recommended path for a real client.

---

## How to deploy it free on Vercel (10 minutes)

### One-command GitHub deploy (recommended)

On your own machine (where you're logged into GitHub), download this folder, then:

```bash
# if you have the GitHub CLI installed (gh):
gh auth login                     # one-time login, if not already logged in
./deploy-to-github.sh             # creates the repo "findit-ghana" (private) and pushes
# options: ./deploy-to-github.sh my-repo-name public
```

The script falls back to plain `git` if the GitHub CLI is missing (it will ask for your username and repo name).

### Then connect Vercel (2 minutes)

1. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import the repo.
2. Vercel detects Next.js automatically — click **Deploy**. Done: you get a live URL like `https://findit-ghana.vercel.app`.
3. Every push to the `main` branch now deploys automatically. Pull requests get their own preview URLs.
4. A **daily price-refresh cron** is pre-configured in `vercel.json` (06:00 UTC, calls `/api/refresh`).
5. A free GitHub Actions **build check** runs on every push/PR (`npm run build` must pass) — the quality gate before Vercel deploys.
6. A second Actions workflow (**Refresh Jumia Ghana catalogue**) re-scrapes jumia.com.gh **daily at 05:20 UTC**, commits new prices to `main` when they change, and Vercel deploys them — the "prices checked daily" promise runs itself.

### Refreshing the real Jumia Ghana catalogue

The product catalogue is committed snapshots of **real Ghanaian retailer listings**:

- `data/jumia-catalog.json` — Jumia Ghana marketplace (buy buttons go through the affiliate link)
- `data/compughana-catalog.json` — CompuGhana (buy buttons go directly to compughana.com)
- `data/franko-catalog.json` — Franko Trading (buy buttons go directly to frankotrading.com)
- `data/telefonika-catalog.json` — Telefonika (buy buttons go directly to telefonika.com)

Every price is a live GH₵ listing price. To refresh Jumia prices, run this on any machine with normal internet access:

```bash
node scripts/fetch-jumia.mjs
```

It re-scrapes the Jumia GH category pages and rewrites the snapshot. Partner catalogues are updated by editing the matching JSON file. Check the diff, `npm run build`, then commit — Vercel deploys the new prices automatically.

### Connecting the free database (optional but recommended)

1. Go to **supabase.com** → **New project** (free plan).
2. Open **SQL Editor** → paste and run `supabase/migrations/001_init.sql`, then `002_featured_listings.sql`, then `003_vendor_plans.sql`, then `004_vendor_passwords.sql`, then `005_unlimited_plan.sql`, then `006_listing_images.sql` (adds the product-photo column and the public `vendor-images` storage bucket), then `007_vendor_listing_updates.sql` (adds `vendor_listings.updated_at`, which powers the "Prices checked" freshness after a vendor edits their price).
3. Paste and run `supabase/seed.sql` (demo data — optional; live catalogue is the JSON snapshots).
4. In Supabase **Settings → API**, copy `Project URL`, `anon public` key and `service_role` key.
5. Add these as environment variables in Vercel (Project → Settings → Environment Variables):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — plus `CRON_SECRET` (any long random string) and `ADMIN_PASSWORD`.

The site switches to database mode automatically.

### Attaching your custom domain (when you sell it)

**Namecheap:** Domain List → Manage → Advanced DNS → Host Records → add:
- Type **A Record**, Host `@`, Value `76.76.21.21`, TTL Automatic
- Type **CNAME Record**, Host `www`, Value `cname.vercel-dns.com`, TTL Automatic
- Delete any conflicting default records, save, and wait a few minutes.

**Cloudflare:** Add the domain in Cloudflare, point your registrar's nameservers to Cloudflare's, then in **DNS → Records** add the same A + CNAME records with **Proxy status: DNS only** (grey cloud).

Then in Vercel: **Project → Settings → Domains → Add** — Vercel verifies and issues a free SSL certificate.

---

## Repository structure

```
app/                pages + API routes (Next.js App Router)
  api/              serverless functions: refresh cron, search suggest,
                    reports, contact, click tracking, admin login/queue/guides
  admin/            password-protected dashboard (overview, queue, editor)
  product/[slug]/   product pages with the vendor comparison table
  category/[slug]/  category pages (SEO templates)
  guides/           price guides + article template
components/         reusable UI: header/footer, product cards, vendor table,
                    price chart, forms, trust strip, empty states
lib/                data access, storage layer (Supabase or JSON), utilities
data/               catalogue snapshots + site dataset (Jumia, CompuGhana, Franko Trading, Telefonika)
scripts/            fetch-jumia.mjs — refreshes the Jumia Ghana catalogue snapshot
supabase/           database schema + seed SQL for the free-tier database
public/             favicon and static assets
```

## How vendors list products (register your shop, then list from the dashboard)

Two steps: **register the shop**, then **list products from the dashboard**.

1. A vendor opens **/for-vendors** and registers their shop only — business name, contact, phone/WhatsApp, email, optional website, a plan (Free / Starter GH₵50 / Pro GH₵150 / Unlimited GH₵300) and a dashboard password. No product fields here.
2. The shop lands in the admin **Vendors & plans** queue as *pending*. Nothing enters the listings queue at signup — no product is created yet.
3. Paid plans: vendor pays MoMo to **053 126 2424**, WhatsApps the reference, admin clicks **MoMo → Starter 30d**, **MoMo → Pro 30d** or **MoMo → Unlimited 30d**. Until confirmed the shop runs on Free limits (3 listings).
4. The vendor signs in at **/vendor** (phone + password — the signup already sets the login cookie) and adds products on **/vendor/listings** with **at least 3 product photos** (up to 6) each. That "Add a listing" form is the only place listings are created. The plan cap applies: Free = 3 listings, Starter = 10, Pro = 25, Unlimited = no cap — one past the cap and the form shows the upgrade prompt instead.
5. Each product lands in the admin **Vendor listings** queue as *pending* — nothing goes live unreviewed. Admin clicks **Approve → live**.
6. Approved products appear in search, category pages and **/vendors/[slug]**, with a **photo gallery** (thumbnail strip + full-screen lightbox) and a **WhatsApp buy button** (no commission). Same-named products from different shops share one product page and pool all their photos. On Pro / Unlimited the dashboard also shows shop views and outbound clicks. Shops listed before login existed can create a password once (phone + matching business name).

**Vendors edit their own prices.** On **/vendor/listings** every row has an **Edit** button that expands an inline form — price, units in stock, delivery fee, delivery days and description, prefilled with the current values. Save and the row, the product page, the admin listings queue and the search results all pick up the new price immediately (no re-review — edits to approved listings go live right away). The product page's "Prices checked" timestamp switches to the edit time (`updated_at`, added by `007_vendor_listing_updates.sql`). Name, category, photos and status are not editable.

Listings and shops are stored in the same three-tier store as form submissions (Supabase tables `vendor_listings` + `vendor_profiles` in production — private by design, since they contain phone numbers). **Product photos** use the same tiering: Supabase Storage bucket `vendor-images` (created by `006_listing_images.sql`) in production, `public/uploads/listings/<slug>/` on a dev machine (served at `/uploads/...`), and refused with a clear message on the public demo store (the shared JSON object can't hold image bytes).

**Every photo is auto-compressed on upload** (server-side, before it reaches any tier): the longest side is resized to ≤ 1600 px and the image is re-encoded at quality ~80 (JPEG for JPG/PNG input, WebP stays WebP). A ~3 MB phone photo is typically stored well under ~500 KB while still looking sharp in the gallery. The browser also downscales large photos before sending, so vendors on mobile data upload less — the server pass is the source of truth either way.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react icons · Supabase (Postgres, free tier) · Vercel (free tier). **No paid services anywhere in the stack.**

## License & notes

- The site is intended to be sold as a finished product; all copy is placeholder-quality but complete (a copywriter can swap wording without changing layout).
- Jumia buy buttons are wired through the configured affiliate link (`NEXT_PUBLIC_JUMIA_AFFILIATE_URL`, defaulting to Obed's JForce/Jumia link). Replace it during buyer handoff if the buyer wants their own affiliate account.
- The admin login uses a simple signed-cookie password for the demo; production handoff can swap in Supabase Auth (schema and client already wired in `lib/store.ts`).
