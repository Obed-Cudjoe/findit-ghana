import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, ShieldAlert, MousePointerClick, Package, Store, ClipboardList } from "lucide-react";
import { readReports, readContactMessages, readClicks, readVendorProfiles, readVendorListings, readPriceAlerts } from "@/lib/store";
import { getProducts } from "@/lib/data";
import { AdminActualPrices } from "@/components/admin-actual-prices";

export const metadata: Metadata = { title: "Admin Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [reports, contacts, clicks, profiles, listings, priceAlerts] = await Promise.all([
    readReports(),
    readContactMessages(),
    readClicks(),
    readVendorProfiles(),
    readVendorListings(),
    readPriceAlerts(),
  ]);
  const openReports = reports.filter((r) => r.status === "new" || r.status === "checking");
  const products = getProducts().length;
  const pendingPay = profiles.filter((p) => p.paymentStatus === "pending").length;
  const pendingListings = listings.filter((l) => l.status === "pending").length;
  const triggeredAlerts = priceAlerts.filter((a) => a.status === "triggered");

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
          <div key={s.label} className="rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5">
            <s.icon className="h-5 w-5 text-gold-600 dark:text-gold-500" strokeWidth={1.8} />
            <p className="mt-3 text-2xl font-extrabold text-navy-900 dark:text-navy-100">{s.value}</p>
            <p className="text-xs text-slate-soft dark:text-navy-300">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-extrabold text-navy-900 dark:text-navy-100">Recent activity</h2>
      {recent.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
          Nothing yet — submit a test report from the public forms to see the queue light up.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-navy-100 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
          {recent.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <span className="font-semibold text-navy-900 dark:text-navy-100">
                {r.kind === "contact" ? "Contact message" : `Report ${r.refCode}`}
                <span className="ml-2 font-normal text-slate-soft dark:text-navy-300">{r.kind === "contact" ? (r as { name?: string }).name : r.kind.replace("_", " ")}</span>
              </span>
              <span className="text-xs text-slate-400">{new Date(r.createdAt as string).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-extrabold text-navy-900 dark:text-navy-100">
        Price-drop alerts {triggeredAlerts.length > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-200">{triggeredAlerts.length} ready to send</span>}
      </h2>
      {triggeredAlerts.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900/50 p-8 text-center text-sm text-slate-soft dark:text-navy-300">
          No triggered alerts yet. When the daily check finds a product at or below a shopper&apos;s target price, the alert appears here with a one-tap WhatsApp message.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-navy-100 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900">
          {triggeredAlerts.map((a) => {
            const digits = a.phone.replace(/[^0-9]/g, "").replace(/^0/, "233");
            const msg = `Hello! Good news — ${a.productName} has dropped to your target of GH₵${a.targetPriceGhs.toLocaleString("en-GH")} on FindIt Ghana. Check the latest price: https://findit-ghana.vercel.app/product/${a.productSlug}`;
            const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
            return (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-navy-900 dark:text-navy-100">{a.productName}</span>
                  <span className="ml-2 text-xs text-slate-soft dark:text-navy-300">target GH₵{a.targetPriceGhs.toLocaleString("en-GH")} · +{a.phone} · triggered {a.triggeredAt ? new Date(a.triggeredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                </span>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 transition-colors"
                >
                  Send WhatsApp ↗
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <AdminActualPrices />
    </div>
  );
}
