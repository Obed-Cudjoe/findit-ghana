# FindIt Ghana — Ghana's Price Finder

**A complete, ready-to-sell website that compares live prices in cedis from named vendors across Ghana.**

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

**Every page is finished:** home, search, 16 product pages, 6 category pages, price guides, trust & methodology, about, contact, two working report forms, privacy/terms, and a password-protected admin dashboard with a corrections queue and content editor.

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

Open **http://localhost:3000** — the site is live, seeded with 16 demo products, 6 vendors and 4 guides.

### Admin dashboard

Visit **/admin** and sign in with the demo password `findit-admin-2026` (change it via the `ADMIN_PASSWORD` environment variable). The dashboard shows:

- **Overview** — open corrections, suspicious reports, outbound clicks tracked
- **Corrections & reports** — every form submission, with one-click actions (Check / Fixed / Dismiss)
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

### Connecting the free database (optional but recommended)

1. Go to **supabase.com** → **New project** (free plan).
2. Open **SQL Editor** → paste and run `supabase/migrations/001_init.sql` (creates 8 tables + security policies).
3. Paste and run `supabase/seed.sql` (demo data).
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
data/               seed dataset (16 products, 6 vendors, 36 offers, 4 guides)
supabase/           database schema + seed SQL for the free-tier database
public/             favicon and static assets
```

## How vendors list products (the "List your product" flow)

1. A vendor opens **/for-vendors** and submits their business details + product (name, category, cedis price, stock, delivery, description).
2. The listing lands in the admin **Vendor listings** queue as *pending* — nothing goes live unreviewed.
3. The admin clicks **Approve → live** and the product immediately appears in search and category pages, with a **WhatsApp buy button** straight to the vendor's number (no commission taken).
4. Listings can be rejected; every listing keeps the vendor's name and contact, consistent with the site's "named vendors only" promise.

Listings are stored in the same three-tier store as form submissions (Supabase table `vendor_listings` in production — private by design, since listings contain phone numbers).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react icons · Supabase (Postgres, free tier) · Vercel (free tier). **No paid services anywhere in the stack.**

## License & notes

- The site is intended to be sold as a finished product; all copy is placeholder-quality but complete (a copywriter can swap wording without changing layout).
- Affiliate links currently point to Jumia product pages without an affiliate tag — apply for a free Jumia Affiliate Program account and add the key in `lib/data.ts` when the buyer takes over.
- The admin login uses a simple signed-cookie password for the demo; production handoff can swap in Supabase Auth (schema and client already wired in `lib/store.ts`).
