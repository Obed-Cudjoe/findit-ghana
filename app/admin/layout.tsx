import Link from "next/link";
import { LogOutButton } from "./logout-button";
import { storageTier } from "@/lib/store";

const TIER_BANNERS: Record<string, { className: string; text: string }> = {
  supabase: {
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    text: "Submissions are stored in your Supabase database. ✓",
  },
  "local-files": {
    className: "border-navy-200 bg-navy-50 text-navy-800",
    text: "Submissions are stored in local JSON files (data/submissions/) — dev machines only, not available on Vercel.",
  },
  "public-demo-store": {
    className: "border-red-300 bg-red-50 text-red-800",
    text: "⚠ Public demo store: submissions (including vendor phone numbers and emails) are publicly readable and writable. Connect Supabase before inviting vendors — see README → Connecting the free database.",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const tier = storageTier();
  const banner = TIER_BANNERS[tier];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">FindIt Ghana · Admin</p>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-navy-100">Dashboard</h1>
        </div>
        <LogOutButton />
      </div>
      <p className={`mb-4 rounded-xl border px-4 py-2.5 text-xs font-semibold ${banner.className}`} role="status">
        Storage: {banner.text}
      </p>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Admin navigation" className="flex flex-wrap gap-1 lg:block lg:space-y-1">
          {[
            ["/admin", "Overview"],
            ["/admin/queue", "Corrections & reports"],
            ["/admin/listings", "Vendor listings"],
            ["/admin/vendors", "Vendors & plans"],
            ["/admin/editor", "Content editor"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg bg-navy-50 dark:bg-navy-900/60 px-4 py-2.5 text-sm font-semibold text-navy-800 dark:text-navy-200 hover:bg-navy-100 hover:text-navy-900 transition-colors lg:block lg:bg-transparent lg:hover:bg-navy-50"
            >
              {label}
            </Link>
          ))}
          <p className="mt-6 hidden rounded-lg bg-navy-50 dark:bg-navy-900/60 p-3 text-xs text-slate-soft dark:text-navy-300 lg:block">
            Prices and listings are managed by the data pipeline — static pages and guides are edited in the content editor.
          </p>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
