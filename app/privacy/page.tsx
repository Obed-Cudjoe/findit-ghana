import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "FindIt Ghana privacy policy — what we collect, cookies, affiliate links and how long we keep data." };

const SECTIONS = [
  ["What we collect", "Basic visit analytics (pages viewed, country, device type) and the details you send in report and contact forms. We do not ask for payment details and never will — payments never pass through this site."],
  ["Cookies", "We use minimal cookies for analytics only. There are no tracking ads at launch."],
  ["Affiliate links", "Some vendor links are affiliate links — clicking them never changes your price; we may earn a small commission if you buy. We say so where it applies."],
  ["How long we keep data", "Report data is kept for 12 months, then anonymised. Contact messages are kept for 24 months."],
  ["Your rights", "You may request a copy or deletion of anything you submitted by emailing us from the address you used."],
  ["Contact", "Privacy questions: cudjoe.obed.gh@gmail.com."],
] as const;

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">Last updated: 24 August 2026</p>
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
