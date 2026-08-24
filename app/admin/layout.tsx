import Link from "next/link";
import { LogOutButton } from "./logout-button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-700">FindIt Ghana · Admin</p>
          <h1 className="text-2xl font-extrabold text-navy-900">Dashboard</h1>
        </div>
        <LogOutButton />
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Admin navigation" className="space-y-1">
          {[
            ["/admin", "Overview"],
            ["/admin/queue", "Corrections & reports"],
            ["/admin/listings", "Vendor listings"],
            ["/admin/editor", "Content editor"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50 hover:text-navy-900 transition-colors"
            >
              {label}
            </Link>
          ))}
          <p className="mt-6 rounded-lg bg-navy-50 p-3 text-xs text-slate-soft">
            Prices and listings are managed by the data pipeline — static pages and guides are edited in the content editor.
          </p>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
