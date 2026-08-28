import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { siteConfig } from "@/lib/data";
import { MobileMenu } from "@/components/mobile-menu";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["price in ghana", "phone prices ghana", "laptop prices accra", "compare prices ghana", "ghana online shopping"],
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0F2A43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {/* Site header — shared across every public page */}
        <header className="sticky top-0 z-40 bg-navy-900 text-white shadow-lg">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex h-16 min-w-0 items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="FindIt Ghana home">
                <svg width="30" height="30" viewBox="0 0 150 150" aria-hidden="true" className="shrink-0">
                  <circle cx="66" cy="66" r="38" fill="none" stroke="#FFFFFF" strokeWidth="11" />
                  <line x1="93.5" y1="93.5" x2="121.5" y2="121.5" stroke="#FFFFFF" strokeWidth="17" strokeLinecap="round" />
                  <path d="M66,43 L71.17,58.89 L87.87,58.89 L74.36,68.72 L79.52,84.61 L66,74.79 L52.48,84.61 L57.64,68.72 L44.13,58.89 L60.83,58.89 Z" fill="#F2B705" />
                </svg>
                <span className="text-lg font-extrabold tracking-tight">
                  FindIt<span className="text-gold-500"> Ghana</span>
                </span>
              </Link>

              {/* Desktop nav — lg+ so tablets keep the hamburger instead of overflowing */}
              <nav className="ml-4 hidden lg:flex items-center gap-4 xl:ml-6 xl:gap-5 text-sm text-navy-100" aria-label="Main navigation">
                <Link href="/category/phones" className="hover:text-white transition-colors">Phones</Link>
                <Link href="/category/laptops" className="hover:text-white transition-colors">Laptops</Link>
                <Link href="/category/appliances" className="hover:text-white transition-colors">Appliances</Link>
                <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
                <Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link>
                <Link href="/how-it-works" className="hidden xl:inline hover:text-white transition-colors">How it works</Link>
                <Link href="/for-vendors" className="whitespace-nowrap font-semibold text-gold-400 hover:text-gold-300 transition-colors">For vendors</Link>
              </nav>

              <div className="ml-auto hidden lg:block w-48 xl:w-64">
                <HeaderSearch />
              </div>

              <Link href="/trust" className="ml-3 hidden xl:inline-flex items-center gap-1.5 rounded-full border border-navy-600 px-3 py-1.5 text-xs text-navy-100 hover:border-gold-500 hover:text-gold-400 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg>
                How we stay honest
              </Link>

              {/* Mobile hamburger */}
              <MobileMenu />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Site footer — shared across every public page */}
        <footer className="bg-navy-950 text-navy-200">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div>
                <p className="font-bold text-white">Explore</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link className="hover:text-gold-400 transition-colors" href="/category/phones">Phones</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/category/laptops">Laptops</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/category/tv-audio">TVs &amp; Audio</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/category/appliances">Appliances</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/category/gaming">Gaming</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-white">Trust</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link className="hover:text-gold-400 transition-colors" href="/trust">How we stay honest</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/how-it-works">How it works</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/report/price">Report a price error</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/report/suspicious">Report a suspicious listing</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-white">Company</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link className="hover:text-gold-400 transition-colors" href="/about">About</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/guides">Price guides</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/vendors">Vendor directory</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/for-vendors">For vendors — sell your products</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/vendor/login">Vendor login</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/contact">Contact</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-white">Legal</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link className="hover:text-gold-400 transition-colors" href="/privacy">Privacy policy</Link></li>
                  <li><Link className="hover:text-gold-400 transition-colors" href="/terms">Terms of service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-10 border-t border-navy-800 pt-6 text-xs text-navy-300">
              <p>
                We show prices and route you to the vendor — the sale happens on the vendor&apos;s own site.
                Some links are affiliate links; clicking them never changes the price you pay.
              </p>
              <p className="mt-2">
                © {new Date().getFullYear()} FindIt Ghana · {siteConfig.tagline} · Named vendors · Prices checked daily · Delivery shown upfront
              </p>
              <p className="mt-3">
                Contact:{" "}
                <a className="hover:text-gold-400 transition-colors" href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
                {" · "}
                <a className="hover:text-gold-400 transition-colors" href="tel:+233531262424">{siteConfig.contactPhone}</a>
                {" · "}
                <a className="hover:text-gold-400 transition-colors" href={siteConfig.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </p>
            </div>
          </div>
        </footer>

        {/* Google Analytics in <head> (Search Console/verification require head placement) — active only when NEXT_PUBLIC_GA_ID is set */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="beforeInteractive"
            />
            <Script id="ga" strategy="beforeInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}

        {/* Vercel Web Analytics — page views and traffic insights, enabled on Vercel */}
        <Analytics />
      </body>
    </html>
  );
}

/* Compact search used in the header (desktop) — submits to /search */
function HeaderSearch() {
  return (
    <form action="/search" method="get" role="search">
      <label htmlFor="header-q" className="sr-only">Search prices</label>
      <div className="flex items-center rounded-full bg-navy-800 focus-within:ring-2 focus-within:ring-gold-500 overflow-hidden">
        <input
          id="header-q"
          name="q"
          type="search"
          placeholder="Search prices in Ghana…"
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-navy-300 focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="shrink-0 bg-gold-500 px-4 py-2 text-navy-950 hover:bg-gold-400 transition-colors">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        </button>
      </div>
    </form>
  );
}
