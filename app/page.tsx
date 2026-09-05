import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Truck, BookOpen, Smartphone } from "lucide-react";
import { getCategories, getGuides, getProducts, getOffersForProduct, officialSources, getFeaturedProVendors, getHomepagePicks } from "@/lib/data";
import { ProductCard, TrustStrip, OfficialSources } from "@/components/shared";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { VendorAvatar } from "@/components/vendor-avatar";
import { UNLIMITED_BADGE } from "@/lib/plans";

// ISR: the homepage regenerates at most once an hour — featured shops and
// approved listings change at admin pace, not visitor pace. Warm visitors
// get static HTML from the CDN (~50ms) instead of a Supabase round-trip per
// request (1.2s). Fallbacks in the data layer keep the page safe if a
// regeneration hits a store outage.
export const revalidate = 3600;

export default async function HomePage() {
  const categories = getCategories();
  const guides = (await getGuides()).slice(0, 3);
  // One live product from each official price source so CompuGhana, Franko
  // Trading and Telefonika sit next to Jumia on the homepage — not buried
  // behind 80 marketplace listings.
  const featuredShops = await getFeaturedProVendors();
  // "What Ghana is searching for": one rotating pick per official shop
  // (changes daily) + up to 2 approved independent vendor listings —
  // featured listings first, then the newest.
  const popular = await getHomepagePicks();

  return (
    <>
      {/* ===== HERO: the promise + the search, above the fold ===== */}
      {/* NOTE: no overflow-hidden here — it clipped the autocomplete dropdown
          on mobile (suggestions appeared cut off / overlapping the chips). */}
      <section className="relative bg-navy-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(700px 340px at 20% 0%, rgba(242,183,5,0.28), transparent 60%), radial-gradient(600px 300px at 90% 100%, rgba(90,140,190,0.25), transparent 60%)" }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <p className="mx-auto mb-4 inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-navy-600 bg-navy-800/70 px-4 py-1.5 text-center text-xs text-navy-100">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" /> <span className="min-w-0">Ghana&apos;s price finder — live prices, named vendors</span>
          </p>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Find what it really costs <span className="text-gold-500">in Ghana</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-navy-100 md:text-lg">
            One search. Real cedis prices, live stock and delivery costs — from named vendors only.
          </p>

          {/* hero search — live autocomplete (F01) */}
          <div className="mx-auto mt-8 max-w-xl">
            <SearchAutocomplete variant="hero" />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-navy-100">
            <span className="text-navy-300">Popular:</span>
            {["tecno", "samsung", "laptops", "compughana", "franko"].map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-navy-600 px-3 py-1 hover:border-gold-500 hover:text-gold-400 transition-colors">
                {s}
              </Link>
            ))}
            <Link href="/best-value" className="rounded-full border border-gold-500/60 bg-gold-500/10 px-3 py-1 font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors">
              ★ Best value
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TRUST STRIP ===== */}
      <TrustStrip />

      {/* ===== PRO / UNLIMITED FEATURED SHOPS (homepage placement — GH₵100 & GH₵200/mo) ===== */}
      {featuredShops.length > 0 && (
        <section className="border-b border-gold-500/30 bg-gold-500/15">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">Pro &amp; Unlimited · homepage</p>
                <h2 className="mt-1 text-xl font-extrabold text-navy-900 dark:text-navy-100 md:text-2xl">Featured shops</h2>
                <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Independent Pro (GH₵100/month) and {UNLIMITED_BADGE} (GH₵200/month, or GH₵500/year) vendors — Unlimited shops lead this strip.</p>
              </div>
              <Link href="/vendors" className="hidden items-center gap-1 text-sm font-semibold text-gold-700 dark:text-gold-500 hover:gap-2 transition-all sm:inline-flex">
                All vendors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredShops.map((v) => (
                <Link key={v.slug} href={`/vendors/${v.slug}`} className="hover-lift flex items-center gap-3 rounded-xl border border-gold-500/50 bg-white dark:bg-navy-900 p-4 shadow-sm">
                  <VendorAvatar name={v.name} hue={v.logoHue} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 font-extrabold text-navy-900 dark:text-navy-100">
                      {v.name}
                      {v.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                      {v.unlimited && (
                        <span className="rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/60">
                          {UNLIMITED_BADGE}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-soft dark:text-navy-300">
                      {v.listingCount} listing{v.listingCount === 1 ? "" : "s"} · {v.unlimited ? UNLIMITED_BADGE : "★ Pro"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== VERIFIED PRICE SOURCES ===== */}
      <OfficialSources sources={officialSources} />

      {/* ===== POPULAR CATEGORIES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-navy-900 dark:text-navy-100 md:text-2xl">Browse by category</h2>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Every price in cedis, checked within the last 24 hours.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="hover-lift group overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900"
            >
              <div className="flex aspect-square items-center justify-center" style={{ background: c.gradient }}>
                <span className="text-white/85" aria-hidden="true">
                  <CatIcon name={c.icon} />
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-navy-900 dark:text-navy-100 group-hover:text-gold-700 transition-colors">{c.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== POPULAR PRODUCTS ===== */}
      <section className="bg-navy-50/60 dark:bg-navy-900/50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-navy-900 dark:text-navy-100 md:text-2xl">What Ghana is searching for</h2>
              <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Rotates daily — Jumia, CompuGhana, Franko Trading and Telefonika, plus approved independent shops.</p>
            </div>
            <Link href="/category/phones" className="hidden items-center gap-1 text-sm font-semibold text-gold-700 dark:text-gold-500 hover:gap-2 transition-all sm:inline-flex">
              See all phones <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {popular.map(({ product, cheapest }) => (
              <ProductCard key={product.id} product={product} cheapest={cheapest} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== LATEST GUIDES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-navy-900 dark:text-navy-100 md:text-2xl">Latest price guides</h2>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">Buying advice that updates with the prices.</p>
          </div>
          <Link href="/guides" className="hidden items-center gap-1 text-sm font-semibold text-gold-700 dark:text-gold-500 hover:gap-2 transition-all sm:inline-flex">
            All guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="hover-lift group overflow-hidden rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
              <div className="flex h-24 items-center justify-center" style={{ background: g.gradient }}>
                <BookOpen className="h-9 w-9 text-white/80" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy-900 dark:text-navy-100 group-hover:text-navy-600 transition-colors">{g.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-soft dark:text-navy-300">{g.excerpt}</p>
                <p className="mt-2 text-xs text-slate-400">Updated {new Date(g.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {g.readMinutes} min read</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-navy-900 py-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-xl font-extrabold md:text-2xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-navy-100">Three steps between you and the honest price.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "1 · Search any product", text: "Phones, laptops, cookers — anything. One search, one page of real results." },
              { icon: ShieldCheck, title: "2 · Compare vendors in cedis", text: "Stock, delivery time and fees side by side, from named vendors with last-checked timestamps." },
              { icon: Truck, title: "3 · Buy from the vendor", text: "We route you to the seller — the sale happens on their site, with the total cost visible before you click." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-navy-700 bg-navy-800/60 p-6">
                <s.icon className="h-8 w-8 text-gold-500" strokeWidth={1.6} aria-hidden="true" />
                <h3 className="mt-3 font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-navy-100">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-6 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 transition-colors">
              Read the full story <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* ===== FINAL TRUST NOTE ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12 text-center">
        <Smartphone className="mx-auto h-8 w-8 text-gold-600 dark:text-gold-500" strokeWidth={1.6} aria-hidden="true" />
        <h2 className="mt-3 text-xl font-extrabold text-navy-900 dark:text-navy-100">We never take payments. We never hold stock. We never hide delivery costs.</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-soft dark:text-navy-300">
          FindIt Ghana shows you the honest picture — then steps out of the way. See how we keep prices honest on our <Link href="/trust" className="font-semibold text-gold-700 dark:text-gold-500 underline">trust &amp; methodology</Link> page.
        </p>
      </section>

      {/* ===== SELL ON FINDIT GHANA (vendor acquisition) ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Link href="/for-vendors" className="hover-lift group flex flex-col items-center justify-between gap-4 rounded-2xl bg-gold-500 px-5 py-7 text-center text-navy-950 sm:px-8 sm:py-8 md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl">Sell on FindIt Ghana</h2>
            <p className="mt-1 text-sm font-medium text-navy-900/80">
              Register your shop free, then list your products — shoppers find them, message you on WhatsApp, and buy directly from you. No commission on sales.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-navy-950 px-6 py-3 text-sm font-bold text-white group-hover:bg-navy-900 transition-colors">
            Register your shop <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </>
  );
}

function CatIcon({ name }: { name: string }) {
  const map: Record<string, React.ReactNode> = {
    smartphone: <Smartphone className="h-10 w-10" strokeWidth={1.4} />,
    laptop: <LaptopGlyph />,
    tv: <TvGlyph />,
    refrigerator: <FridgeGlyph />,
    gamepad: <GamepadGlyph />,
    shirt: <ShirtGlyph />,
  };
  return map[name] ?? <Smartphone className="h-10 w-10" strokeWidth={1.4} />;
}
import { Laptop, Tv, Refrigerator, Gamepad, Shirt } from "lucide-react";
function LaptopGlyph() { return <Laptop className="h-10 w-10" strokeWidth={1.4} />; }
function TvGlyph() { return <Tv className="h-10 w-10" strokeWidth={1.4} />; }
function FridgeGlyph() { return <Refrigerator className="h-10 w-10" strokeWidth={1.4} />; }
function GamepadGlyph() { return <Gamepad className="h-10 w-10" strokeWidth={1.4} />; }
function ShirtGlyph() { return <Shirt className="h-10 w-10" strokeWidth={1.4} />; }
