import type { Metadata } from "next";
import Link from "next/link";
import { Store, Search, MessageCircle, ShieldCheck } from "lucide-react";
import { VendorListingForm } from "@/components/vendor-listing-form";

export const metadata: Metadata = {
  title: "For Vendors — List Your Product Free",
  description: "List your product on FindIt Ghana free — Ghanaian shoppers find it, message you on WhatsApp, and buy directly from you. No commission on sales.",
};

export default function ForVendorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700">For vendors</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900">Put your product in front of Ghanaian shoppers</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-soft">
          When someone searches &quot;price of iPhone 13 in Ghana&quot;, they should find <strong className="text-navy-900">you</strong>.
          List your product free — shoppers see your price in cedis, your stock level, and a WhatsApp button that goes straight to you.
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

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
            <Store className="h-5 w-5 text-gold-600" /> List your product
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-soft">Two short sections. Takes about two minutes.</p>
          <VendorListingForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-navy-100 bg-navy-50/70 p-5">
            <h2 className="font-bold text-navy-900">What happens next</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-soft">
              <li><span className="font-bold text-navy-900">1.</span> Your listing enters our review queue.</li>
              <li><span className="font-bold text-navy-900">2.</span> We check it (usually within 1 business day).</li>
              <li><span className="font-bold text-navy-900">3.</span> It goes live with your name, price and WhatsApp link.</li>
            </ol>
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
