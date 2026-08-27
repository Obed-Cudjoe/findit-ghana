import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, ShieldAlert, MousePointerClick, Package, Store, ClipboardList } from "lucide-react";
import { readReports, readContactMessages, readClicks, readVendorProfiles, readVendorListings } from "@/lib/store";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [reports, contacts, clicks, profiles, listings] = await Promise.all([
    readReports(),
    readContactMessages(),
    readClicks(),
    readVendorProfiles(),
    readVendorListings(),
  ]);
  const openReports = reports.filter((r) => r.status === "new" || r.status === "checking");
  const products = getProducts().length;
  const pendingPay = profiles.filter((p) => p.paymentStatus === "pending").length;
  const pendingListings = listings.filter((l) => l.status === "pending").length;

  const stats = [
    { icon: Inbox, label: "Open corrections", value: openReports.filter((r) => r.kind !== "suspicious").length },
    { icon: ShieldAlert, label: "Open suspicious reports", value: openReports.filter((r) => r.kind === "suspicious").length },
    { icon: MousePointerClick, label: "Outbound clicks tracked", value: clicks.length },
    { icon: Package, label: "Products tracked", value: products },
  ];

  const recent = [...reports, ...contacts.map((c) => ({ ...c, kind: "contact", refCode: "—", createdAt: c.createdAt }))]
    .sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string))
    .slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-navy-100 bg-white p-5">
            <s.icon className="h-5 w-5 text-gold-600" strokeWidth={1.8} />
            <p className="mt-3 text-2xl font-extrabold text-navy-900">{s.value}</p>
            <p className="text-xs text-slate-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-extrabold text-navy-900">Recent activity</h2>
      {recent.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-navy-200 bg-navy-50/50 p-8 text-center text-sm text-slate-soft">
          Nothing yet — submit a test report from the public forms to see the queue light up.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
          {recent.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <span className="font-semibold text-navy-900">
                {r.kind === "contact" ? "Contact message" : `Report ${r.refCode}`}
                <span className="ml-2 font-normal text-slate-soft">{r.kind === "contact" ? (r as { name?: string }).name : r.kind.replace("_", " ")}</span>
              </span>
              <span className="text-xs text-slate-400">{new Date(r.createdAt as string).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
