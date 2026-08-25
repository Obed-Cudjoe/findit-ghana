import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Clock, Truck, BookOpen, Smartphone } from "lucide-react";
import { getCategories, getGuides, getProducts, getOffersForProduct, searchProducts } from "@/lib/data";
import { ProductCard, TrustStrip } from "@/components/shared";

export default async function HomePage() {
  const categories = getCategories();
  const guides = (await getGuides()).slice(0, 3);
  const popular = searchProducts("phone").slice(0, 4).length >= 4
    ? searchProducts("phone").slice(0, 4)
    : getProducts().slice(0, 4).map((product) => ({ product, offers: getOffersForProduct(product.slug), cheapest: getOffersForProduct(product.slug)[0] }));

  return (
    <>
      {/* ===== HERO: the promise + the search, above the fold ===== */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
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

          {/* hero search */}
          <form action="/search" method="get" role="search" className="mx-auto mt-8 max-w-xl">
            <label htmlFor="hero-q" className="sr-only">Search for a product</label>
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-navy-700 focus-within:ring-2 focus-within:ring-gold-500 sm:flex-row">
              <div className="flex min-w-0 flex-1">
                <span className="flex shrink-0 items-center pl-4 text-slate-soft" aria-hidden="true"><Search className="h-5 w-5" /></span>
                <input
                  id="hero-q"
                  name="q"
                  type="search"
                  placeholder="Try “tecno spark” or “smart tv”…"
                  className="min-w-0 flex-1 px-3 py-4 text-base text-ink placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="shrink-0 bg-gold-500 px-6 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 transition-colors sm:py-0">
                Search
              </button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-navy-100">
            <span className="text-navy-300">Popular:</span>
            {["tecno", "smart tv", "ps5", "fridge", "laptops"].map((s) => (
              <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="rounded-full border border-navy-600 px-3 py-1 hover:border-gold-500 hover:text-gold-400 transition-colors">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST STRIP ===== */}
      <TrustStrip />

      {/* ===== POPULAR CATEGORIES ===== */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Browse by category</h2>
            <p className="mt-1 text-sm text-slate-soft">Every price in cedis, checked within the last 24 hours.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="hover-lift group overflow-hidden rounded-xl border border-navy-100 bg-white"
            >
              <div className="flex aspect-square items-center justify-center" style={{ background: c.gradient }}>
                <span className="text-white/85" aria-hidden="true">
                  <CatIcon name={c.icon} />
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-navy-900 group-hover:text-gold-700 transition-colors">{c.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== POPULAR PRODUCTS ===== */}
      <section className="bg-navy-50/60 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">What Ghana is searching for</h2>
              <p className="mt-1 text-sm text-slate-soft">Live offers from named vendors, sorted by total cost.</p>
            </div>
            <Link href="/category/phones" className="hidden items-center gap-1 text-sm font-semibold text-gold-700 hover:gap-2 transition-all sm:inline-flex">
              See all phones <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Latest price guides</h2>
            <p className="mt-1 text-sm text-slate-soft">Buying advice that updates with the prices.</p>
          </div>
          <Link href="/guides" className="hidden items-center gap-1 text-sm font-semibold text-gold-700 hover:gap-2 transition-all sm:inline-flex">
            All guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {guides.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="hover-lift group overflow-hidden rounded-xl border border-navy-100 bg-white">
              <div className="flex h-24 items-center justify-center" style={{ background: g.gradient }}>
                <BookOpen className="h-9 w-9 text-white/80" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-navy-900 group-hover:text-navy-600 transition-colors">{g.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-soft">{g.excerpt}</p>
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
        <Smartphone className="mx-auto h-8 w-8 text-gold-600" strokeWidth={1.6} aria-hidden="true" />
        <h2 className="mt-3 text-xl font-extrabold text-navy-900">We never take payments. We never hold stock. We never hide delivery costs.</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-soft">
          FindIt Ghana shows you the honest picture — then steps out of the way. See how we keep prices honest on our <Link href="/trust" className="font-semibold text-gold-700 underline">trust &amp; methodology</Link> page.
        </p>
      </section>

      {/* ===== SELL ON FINDIT GHANA (vendor acquisition) ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Link href="/for-vendors" className="hover-lift group flex flex-col items-center justify-between gap-4 rounded-2xl bg-gold-500 px-5 py-7 text-center text-navy-950 sm:px-8 sm:py-8 md:flex-row md:text-left">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl">Sell on FindIt Ghana</h2>
            <p className="mt-1 text-sm font-medium text-navy-900/80">
              List your product free — shoppers find it, message you on WhatsApp, and buy directly from you. No commission on sales.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-navy-950 px-6 py-3 text-sm font-bold text-white group-hover:bg-navy-900 transition-colors">
            List your product <ArrowRight className="h-4 w-4" />
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
