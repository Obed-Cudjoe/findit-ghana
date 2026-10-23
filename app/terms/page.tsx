import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service", description: "FindIt Ghana terms of service — what this site is, price accuracy, your reports and affiliate disclosure." };

const SECTIONS = [
  ["What this site is", "FindIt Ghana provides price-comparison information and a separate Community Market for user-submitted classifieds. Community listings are not part of the curated shop-price catalogue. FindIt does not take payment, hold funds, arrange delivery or guarantee a sale between community members."],
  ["Price accuracy", "Prices are checked on a schedule and shown in good faith, but always confirm the final price and delivery fee with the vendor before paying. We are not liable for differences between a listed price and the vendor's final price."],
  ["Community Market listings", "Listings are supplied by users and reviewed before publication, but review is not proof of identity, ownership, condition, price or safety. Approved listings may publicly show the seller's chosen name, WhatsApp number, photos and details to anyone with the link. Buyers and sellers arrange inspection, payment and delivery directly and should use caution. Do not post illegal, unsafe or misleading listings. Listings expire from public browsing after 30 days; report a concern or request removal through the contact page."],
  ["Your reports", "Keep reports factual. Submitting false or misleading reports, or misusing the report forms, may lead to blocking."],
  ["Affiliate disclosure", "Where a link is an affiliate link, we say so. Clicking it never changes the price you pay."],
  ["Intellectual property", "The FindIt Ghana name, logo and content are protected. Vendors' names and logos belong to their owners."],
  ["Changes", "We'll update this page when terms change; the date above tells you when."],
] as const;

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">Last updated: 21 October 2026</p>
      </header>
      <div className="mt-8 space-y-6">
        {SECTIONS.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-lg font-bold text-navy-900 dark:text-navy-100">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-soft dark:text-navy-300">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
