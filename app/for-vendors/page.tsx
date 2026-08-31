import type { Metadata } from "next";
import Link from "next/link";
import { Store, Search, MessageCircle, ShieldCheck } from "lucide-react";
import { VendorListingForm } from "@/components/vendor-listing-form";
import { MOMO_NUMBER, MOMO_NAME, VENDOR_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "For Vendors — Register Your Shop Free",
  description: "Register your shop on FindIt Ghana free, then list your products from your dashboard — Ghanaian shoppers find them, message you on WhatsApp, and buy directly from you. No commission on sales. Weekly boosts from GH₵10, Starter GH₵50/mo, Pro GH₵100/mo, Unlimited GH₵200/mo or GH₵500/year.",
};

export default function ForVendorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">For vendors</p>
        <h1 className="mt-2 text-2xl font-extrabold text-navy-900 dark:text-navy-100 sm:text-3xl">Put your shop in front of Ghanaian shoppers</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-soft dark:text-navy-300">
          When someone searches &quot;price of iPhone 13 in Ghana&quot;, they should find <strong className="text-navy-900 dark:text-navy-100">you</strong>.
          It takes two steps: <strong className="text-navy-900 dark:text-navy-100">1)</strong> register your shop here and pick a plan, then{" "}
          <strong className="text-navy-900 dark:text-navy-100">2)</strong> log in to your dashboard and list your products with photos.
          The Free plan carries {VENDOR_PLANS.free.listingLimit} live listings — shoppers see your price in cedis, your stock level, and a WhatsApp button straight to you.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Search, title: "Get found first", text: "Your listing appears in search and category pages — the pages Ghanaian shoppers actually land on." },
          { icon: MessageCircle, title: "Buyers message you directly", text: "The contact button opens WhatsApp straight to your number. No middleman, no commission on your sale." },
          { icon: ShieldCheck, title: "Reviewed, then live", text: "Our checks team reviews every listing — usually within 1 business day — so shoppers trust what they see." },
        ].map((b) => (
          <div key={b.title} className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5">
            <b.icon className="h-7 w-7 text-gold-600 dark:text-gold-500" strokeWidth={1.6} aria-hidden="true" />
            <h2 className="mt-2 font-bold text-navy-900 dark:text-navy-100">{b.title}</h2>
            <p className="mt-1 text-sm text-slate-soft dark:text-navy-300">{b.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900 dark:text-navy-100">
            <Store className="h-5 w-5 text-gold-600 dark:text-gold-500" /> Register your shop
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-soft dark:text-navy-300">
            Pick a plan and tell us about your business — about a minute. You add products (with at least 3 photos each) from your dashboard afterwards.
          </p>
          <VendorListingForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/70 dark:bg-navy-900/50 p-5">
            <h2 className="font-bold text-navy-900 dark:text-navy-100">What happens next</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-soft dark:text-navy-300">
              <li><span className="font-bold text-navy-900 dark:text-navy-100">1.</span> Your shop enters our review queue.</li>
              <li><span className="font-bold text-navy-900 dark:text-navy-100">2.</span> Paid plans: send MoMo to {MOMO_NUMBER} ({MOMO_NAME}), then WhatsApp the reference.</li>
              <li><span className="font-bold text-navy-900 dark:text-navy-100">3.</span> Sign in at <Link className="font-semibold text-navy-800 dark:text-navy-200 underline" href="/vendor/login">/vendor</Link> and add your products — at least 3 photos each. Each one goes to review before it appears in search.</li>
              <li><span className="font-bold text-navy-900 dark:text-navy-100">4.</span> Once approved, your shop appears on <Link className="font-semibold text-navy-800 dark:text-navy-200 underline" href="/vendors">/vendors</Link>.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5 text-sm text-slate-soft dark:text-navy-300">
            <h2 className="font-bold text-navy-900 dark:text-navy-100">Already registered?</h2>
            <p className="mt-2">
              Sign in at{" "}
              <Link className="font-semibold text-navy-800 dark:text-navy-200 underline" href="/vendor/login">/vendor</Link>
              {" "}to see your plan, add products, and (on Pro and Unlimited) shop views and outbound clicks.
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-5 text-sm text-slate-soft dark:text-navy-300">
            <h2 className="font-bold text-navy-900 dark:text-navy-100">Questions?</h2>
            <p className="mt-2">Email <a className="text-navy-700 dark:text-navy-300 underline hover:text-gold-700" href="mailto:cudjoe.obed.gh@gmail.com">cudjoe.obed.gh@gmail.com</a> or use the <Link className="text-navy-700 dark:text-navy-300 underline hover:text-gold-700" href="/contact">contact page</Link>.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
