import type { Metadata } from "next";
import Link from "next/link";
import { Store, Search, MessageCircle, ShieldCheck } from "lucide-react";
import { VendorListingForm } from "@/components/vendor-listing-form";
import { PLAN_LIST, MOMO_NUMBER, MOMO_NAME, UNLIMITED_BADGE } from "@/lib/plans";

export const metadata: Metadata = {
  title: "For Vendors — List Your Product Free",
  description: "List your product on FindIt Ghana free — Ghanaian shoppers find it, message you on WhatsApp, and buy directly from you. No commission on sales. Upgrade to Starter (GH₵50), Pro (GH₵150) or Unlimited (GH₵300) for featured placement and top search ranking.",
};

export default function ForVendorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700">For vendors</p>
        <h1 className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">Put your product in front of Ghanaian shoppers</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-soft">
          When someone searches &quot;price of iPhone 13 in Ghana&quot;, they should find <strong className="text-navy-900">you</strong>.
          List your first product free — shoppers see your price in cedis, your stock level, and a WhatsApp button that goes straight to you.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Search, title: "Get found first", text: "Your listing appears in search and category pages — the pages Ghanaian shoppers actually land on." },
          { icon: MessageCircle, title: "Buyers message you directly", text: "The buy button opens WhatsApp straight to your number. No middleman, no commission on your sale." },
          { icon: ShieldCheck, title: "Reviewed, then live", text: "Our checks team reviews every listing — usually within 1 business day — so shoppers trust what they see." },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-navy-100 bg-white p-5">
            <b.icon className="h-7 w-7 text-gold-600" strokeWidth={1.6} aria-hidden="true" />
            <h2 className="mt-2 font-bold text-navy-900">{b.title}</h2>
            <p className="mt-1 text-sm text-slate-soft">{b.text}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold text-navy-900">Plans</h2>
        <p className="mt-1 text-sm text-slate-soft">
          Start free. Paid plans (Starter, Pro and Unlimited) are activated after MoMo to <strong className="text-navy-900">{MOMO_NUMBER}</strong> ({MOMO_NAME}) — we confirm it in admin.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIST.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-5 ${
                p.id === "unlimited"
                  ? "border-navy-900 bg-navy-50/60 ring-1 ring-navy-900/30"
                  : p.id === "starter"
                    ? "border-gold-500 bg-white ring-1 ring-gold-500/30"
                    : "border-navy-100 bg-white"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-gold-700">
                {p.priceGhs === 0 ? "Free forever" : `GH₵${p.priceGhs} / month`}
              </p>
              <h3 className="mt-1 flex flex-wrap items-center gap-1.5 text-xl font-extrabold text-navy-900">
                {p.name}
                {p.unlimited && (
                  <span className="rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/60">
                    {UNLIMITED_BADGE}
                  </span>
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-soft">{p.tagline}</p>
              <p className="mt-2 text-sm font-bold text-navy-900">
                {!Number.isFinite(p.listingLimit)
                  ? "Unlimited listings"
                  : p.listingLimit === 1
                    ? "1 listing"
                    : `Up to ${p.listingLimit} listings`}
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-navy-800">
                {p.perks.map((perk) => (
                  <li key={perk}>• {perk}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
            <Store className="h-5 w-5 text-gold-600" /> List your product
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-soft">Pick a plan, then two short sections. Takes about two minutes.</p>
          <VendorListingForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-navy-100 bg-navy-50/70 p-5">
            <h2 className="font-bold text-navy-900">What happens next</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-soft">
              <li><span className="font-bold text-navy-900">1.</span> Your listing enters our review queue.</li>
              <li><span className="font-bold text-navy-900">2.</span> Paid plans: send MoMo to {MOMO_NUMBER}, then WhatsApp the reference.</li>
              <li><span className="font-bold text-navy-900">3.</span> We confirm payment and approve the listing — your shop appears on <Link className="font-semibold text-navy-800 underline" href="/vendors">/vendors</Link>.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-5 text-sm text-slate-soft">
            <h2 className="font-bold text-navy-900">Already listed?</h2>
            <p className="mt-2">
              Sign in at{" "}
              <Link className="font-semibold text-navy-800 underline" href="/vendor/login">/vendor</Link>
              {" "}to see your plan, add products, and (on Pro and Unlimited) shop views and outbound clicks.
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 p-5 text-sm text-slate-soft">
            <h2 className="font-bold text-navy-900">Questions?</h2>
            <p className="mt-2">Email <a className="text-navy-700 underline hover:text-gold-700" href="mailto:cudjoe.obed.gh@gmail.com">cudjoe.obed.gh@gmail.com</a> or use the <Link className="text-navy-700 underline hover:text-gold-700" href="/contact">contact page</Link>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
