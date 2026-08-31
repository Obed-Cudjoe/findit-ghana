import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Clock, CircleAlert, Phone, Linkedin } from "lucide-react";
import { ContactForm } from "@/components/forms";
import { siteConfig } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Talk to the FindIt Ghana team. We reply within 2 business days — or use the report forms for a faster response on price errors.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold text-navy-900 dark:text-navy-100">Talk to us</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-soft dark:text-navy-300">
          <Clock className="h-4 w-4 text-gold-600 dark:text-gold-500" aria-hidden="true" /> We reply within 2 business days.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 shadow-sm sm:p-6">
          <ContactForm />
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/70 dark:bg-navy-900/50 p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-navy-100"><CircleAlert className="h-4 w-4 text-gold-600 dark:text-gold-500" /> Reporting something?</h2>
            <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">
              For a wrong price or a suspicious vendor, use the report forms — they go straight to the checks team and get a reference number.
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/report/price" className="font-semibold text-navy-700 dark:text-navy-300 underline hover:text-gold-700">Report a price or stock error →</Link>
              <Link href="/report/suspicious" className="font-semibold text-navy-700 dark:text-navy-300 underline hover:text-gold-700">Report a suspicious listing →</Link>
            </div>
          </div>
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-navy-100"><Mail className="h-4 w-4 text-gold-600 dark:text-gold-500" /> Email</h2>
            <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">
              <a href={`mailto:${siteConfig.contactEmail}`} className="break-all text-navy-700 dark:text-navy-300 underline hover:text-gold-700">{siteConfig.contactEmail}</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">Press, partnerships and vendor enquiries all welcome.</p>
          </div>
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-navy-100"><Phone className="h-4 w-4 text-gold-600 dark:text-gold-500" /> Phone / WhatsApp</h2>
            <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">
              <a href="tel:+233531262424" className="text-navy-700 dark:text-navy-300 underline hover:text-gold-700">{siteConfig.contactPhone}</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">Reach us directly on calls or WhatsApp.</p>
          </div>
          <div className="rounded-xl border border-navy-100 dark:border-navy-800 p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy-900 dark:text-navy-100"><Linkedin className="h-4 w-4 text-gold-600 dark:text-gold-500" /> LinkedIn</h2>
            <p className="mt-2 text-sm text-slate-soft dark:text-navy-300">
              <a href={siteConfig.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-navy-700 dark:text-navy-300 underline hover:text-gold-700">linkedin.com/in/obed-cudjoe</a>
            </p>
            <p className="mt-1 text-xs text-slate-400">Connect with the person behind FindIt Ghana.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
