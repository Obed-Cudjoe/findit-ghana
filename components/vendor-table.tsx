// Client component — the vendor comparison table (COMP-08) contains the
// outbound Buy buttons with affiliate click tracking, so it runs in the browser.
"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import type { PriceOffer, Vendor } from "@/lib/types";
import { formatGHS, deliveryLabel, timeAgo } from "@/lib/utils";

function BuyButton({ offer, vendorName, productSlug }: { offer: PriceOffer; vendorName: string; productSlug: string }) {
  async function track() {
    try {
      await fetch("/api/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, vendorName, destinationUrl: offer.affiliateUrl }),
      });
    } catch {
      /* tracking is best-effort — never block the navigation */
    }
  }
  return (
    <a
      href={offer.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={track}
      className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 shadow-sm hover:bg-gold-400 active:scale-[0.98] transition-all"
    >
      Buy <ArrowRight className="h-4 w-4" />
    </a>
  );
}

export function VendorTable({ offers, vendors, productSlug }: { offers: PriceOffer[]; vendors: Vendor[]; productSlug: string }) {
  if (offers.length === 0) {
    return <p className="text-sm text-slate-soft">No live offers for this product right now — check back after the next daily refresh.</p>;
  }
  const vendorOf = (id: string) => vendors.find((v) => v.id === id);
  return (
    <div className="overflow-hidden rounded-xl border border-navy-100">
      {/* table for laptop/desktop; scrolls inside narrow article layouts */}
      <div className="overflow-x-auto">
        <table className="hidden w-full min-w-[860px] text-sm lg:table">
        <thead>
          <tr className="bg-navy-50 text-left text-xs uppercase tracking-wide text-slate-soft">
            <th className="px-4 py-3 font-semibold">Vendor</th>
            <th className="px-4 py-3 font-semibold">Price (GHS)</th>
            <th className="px-4 py-3 font-semibold">In stock</th>
            <th className="px-4 py-3 font-semibold">Delivery</th>
            <th className="px-4 py-3 font-semibold">Fee</th>
            <th className="px-4 py-3 text-right font-semibold">Total</th>
            <th className="px-4 py-3"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o, i) => {
            const v = vendorOf(o.vendorId);
            return (
              <tr key={o.id} className={i % 2 ? "bg-navy-50/50" : "bg-white"}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy-900">
                    {v?.slug ? (
                      <Link href={`/vendors/${v.slug}`} className="hover:text-gold-700 transition-colors">{v.name}</Link>
                    ) : (
                      v?.name ?? "Vendor"
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-slate-soft">
                    {v?.verified ? (
                      <><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified</>
                    ) : (
                      "Unverified"
                    )}
                    <span className="text-slate-300">·</span> checked {timeAgo(o.lastCheckedAt)}
                  </p>
                </td>
                <td className="px-4 py-3 font-bold text-navy-900">{formatGHS(o.priceGhs)}</td>
                <td className="px-4 py-3">
                  {o.stockCount !== null && o.stockCount > 0 ? (
                    <span className="text-emerald-700">{o.stockCount} units</span>
                  ) : (
                    <span className="text-amber-700">Check with vendor</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-soft">{deliveryLabel(o)}</td>
                <td className="px-4 py-3 text-slate-soft">{formatGHS(o.deliveryFeeGhs)}</td>
                <td className="px-4 py-3 text-right font-extrabold text-navy-900">{formatGHS(o.priceGhs + o.deliveryFeeGhs)}</td>
                <td className="px-4 py-3 text-right">
                  <BuyButton offer={o} vendorName={v?.name ?? "vendor"} productSlug={productSlug} />
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      {/* stacked cards for phones/tablets */}
      <div className="divide-y divide-navy-100 lg:hidden">
        {offers.map((o) => {
          const v = vendorOf(o.vendorId);
          return (
            <div key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-navy-900">
                    {v?.slug ? (
                      <Link href={`/vendors/${v.slug}`} className="hover:text-gold-700 transition-colors">{v.name}</Link>
                    ) : (
                      v?.name ?? "Vendor"
                    )}
                  </p>
                  <p className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-slate-soft">
                    {v?.verified && (
                      <><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Verified · </>
                    )}
                    checked {timeAgo(o.lastCheckedAt)}
                  </p>
                </div>
                <p className="shrink-0 text-right text-lg font-extrabold text-navy-900">{formatGHS(o.priceGhs)}</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-soft min-[430px]:grid-cols-3">
                <span className="rounded-lg bg-navy-50 px-2.5 py-2">{o.stockCount ? `${o.stockCount} in stock` : "Check with vendor"}</span>
                <span className="rounded-lg bg-navy-50 px-2.5 py-2">{deliveryLabel(o)}</span>
                <span className="rounded-lg bg-navy-50 px-2.5 py-2">Fee {formatGHS(o.deliveryFeeGhs)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <p className="text-sm font-bold text-navy-900">Total {formatGHS(o.priceGhs + o.deliveryFeeGhs)}</p>
                <BuyButton offer={o} vendorName={v?.name ?? "vendor"} productSlug={productSlug} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 px-1 text-xs text-slate-400">
        Buy buttons open the vendor&apos;s site. Where marked, links are affiliate links — FindIt Ghana may earn a
        commission if you buy, at no extra cost to you. Vendors set their own prices; we show them unchanged.
      </p>
    </div>
  );
}
