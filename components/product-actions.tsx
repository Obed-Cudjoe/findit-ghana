// Product-page trust & sharing actions (server components — no client JS).
//
// 1. ShareWhatsAppButton — shares the product + price to WhatsApp (wa.me),
//    the organic growth loop: every share is an ad for the site.
// 2. SocialLinkButton — surfaces the vendor's TikTok/Facebook/Instagram
//    link from the listing ("watch the shop's video"), turning the form
//    field into a buyer-facing trust feature.
// 3. VendorTrustSignals — "social presence" badge + honest report history
//    (only shown when reports actually exist for this listing).
// 4. BeforeYouPayCard — the 4-question anti-scam checklist, on every
//    product page (same checks as the "spot a fake vendor" guide).

import Link from "next/link";
import { Globe, ShieldCheck, Share2, TriangleAlert, CheckCircle2 } from "lucide-react";
import { formatGHS } from "@/lib/utils";
import { siteConfig } from "@/lib/data";

/* ---------- tiny brand glyphs (lucide dropped brand icons) ---------- */
function TikTokGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function FacebookGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ---------- 1. Share to WhatsApp (every product page) ---------- */
export function ShareWhatsAppButton({
  productName,
  priceGhs,
  slug,
}: {
  productName: string;
  priceGhs: number;
  slug: string;
}) {
  const message = `Check out ${productName} on FindIt Ghana — ${formatGHS(priceGhs)} → ${siteConfig.url}/product/${slug}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-400 active:scale-[0.98] transition-all"
    >
      <WhatsAppGlyph className="h-4 w-4" />
      Share on WhatsApp
    </a>
  );
}

/* ---------- 2. Vendor social link (vendor listings only) ---------- */
function detectPlatform(url: string): { label: string; kind: "tiktok" | "facebook" | "instagram" | "site" } | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return { label: "Watch this shop on TikTok", kind: "tiktok" };
  if (u.includes("facebook.com") || u.includes("fb.com")) return { label: "Visit this shop on Facebook", kind: "facebook" };
  if (u.includes("instagram.com")) return { label: "Follow this shop on Instagram", kind: "instagram" };
  return { label: "Visit this shop's website", kind: "site" };
}

export function SocialLinkButton({ url }: { url: string }) {
  const platform = detectPlatform(url);
  if (!platform) return null;
  const icon = {
    tiktok: <TikTokGlyph className="h-4 w-4" />,
    facebook: <FacebookGlyph className="h-4 w-4" />,
    instagram: <InstagramGlyph className="h-4 w-4" />,
    site: <Globe className="h-4 w-4" />,
  }[platform.kind];
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3.5 py-2 text-sm font-semibold text-navy-800 dark:text-navy-200 hover:border-gold-500 hover:text-gold-700 transition-colors"
    >
      {icon}
      {platform.label}
    </a>
  );
}

/* ---------- 3. Trust signals (vendor listings only) ---------- */
export function VendorTrustSignals({
  socialUrl,
  reports,
}: {
  socialUrl: string;
  reports: { total: number; unresolved: number };
}) {
  const hasSocial = Boolean(socialUrl && detectPlatform(socialUrl));
  if (!hasSocial && reports.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasSocial && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 dark:bg-navy-900/60 px-3 py-1 text-xs font-semibold text-navy-800 dark:text-navy-200 ring-1 ring-navy-100">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Social presence linked — you can see the shop before paying
        </span>
      )}
      {reports.total > 0 &&
        (reports.unresolved === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Report history clean — {reports.total} report{reports.total === 1 ? "" : "s"}, all resolved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 ring-1 ring-amber-200">
            <TriangleAlert className="h-3.5 w-3.5" />
            {reports.unresolved} open report{reports.unresolved === 1 ? "" : "s"} — check with the vendor before paying
          </span>
        ))}
    </div>
  );
}

/* ---------- 4. Before-you-pay checklist (every product page) ---------- */
export function BeforeYouPayCard() {
  const checks = [
    "Is the vendor named? Anonymous pages hide because they plan to disappear.",
    "Is the price in cedis, with delivery shown upfront? Surprise fees are the classic trap.",
    "Do they accept payment on delivery — or at least escrow? Prepay-only is a warning sign.",
    "What do other buyers say? Check reviews outside the vendor's own page.",
  ];
  return (
    <section className="mt-8 rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-900/50 p-5 dark:border-navy-800 dark:bg-navy-900/50">
      <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-navy-900 dark:text-navy-100">
        <ShieldCheck className="h-4 w-4 text-gold-600 dark:text-gold-500" />
        Before you pay — four quick checks
      </h2>
      <ol className="mt-3 grid gap-2 text-xs text-slate-soft dark:text-navy-300 sm:grid-cols-2">
        {checks.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-bold text-gold-700 dark:text-gold-500">{i + 1}.</span>
            {c}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        Full guide:{" "}
        <Link href="/guides/spot-a-fake-vendor" className="font-semibold text-navy-700 dark:text-navy-300 underline hover:text-gold-700">
          How to spot a fake vendor before you pay
        </Link>
      </p>
    </section>
  );
}

/* re-export for convenience where both share + social actions are needed */
export function ProductActionRow({
  productName,
  priceGhs,
  slug,
  socialUrl,
}: {
  productName: string;
  priceGhs: number;
  slug: string;
  socialUrl?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShareWhatsAppButton productName={productName} priceGhs={priceGhs} slug={slug} />
      {socialUrl ? <SocialLinkButton url={socialUrl} /> : null}
    </div>
  );
}
