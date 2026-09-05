"use client";

/* COMP-19: "What people actually paid" — approved crowd-sourced aggregate
   (count + min–max) next to a small submission form. The stats fetch is a
   client call so product pages stay static; the CDN caches the aggregate. */

import { useEffect, useState, type FormEvent } from "react";
import { BadgeCheck, HandCoins, LoaderCircle } from "lucide-react";
import { formatGHS } from "@/lib/utils";

interface Stats {
  count: number;
  min: number | null;
  max: number | null;
}

export function ActualPaidCard({
  productSlug,
  askingPrice,
}: {
  productSlug: string;
  askingPrice?: number;
}) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [price, setPrice] = useState("");
  const [shop, setShop] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    let alive = true;
    fetch(`/api/actual-prices?slug=${encodeURIComponent(productSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setStats(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [productSlug]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return;
    setState("sending");
    try {
      const res = await fetch("/api/actual-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, pricePaidGhs: priceNum, shopName: shop }),
      });
      if (res.ok) {
        setState("done");
        setPrice("");
        setShop("");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-navy-900 dark:text-navy-100">
        <HandCoins className="h-4 w-4 text-gold-600 dark:text-gold-500" />
        What people actually paid
      </p>

      {stats === null ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-soft dark:text-navy-300">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Checking recent buyer reports…
        </p>
      ) : stats.count === 0 ? (
        <p className="mt-2 text-xs text-slate-soft dark:text-navy-300">
          No verified buyer reports yet for this exact product. Bought it recently? Tell us what you paid — it helps the next shopper.
        </p>
      ) : (
        <p className="mt-2 text-sm text-navy-900 dark:text-navy-100">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" /> {stats.count} verified buyer{stats.count === 1 ? "" : "s"}
          </span>{" "}
          reported paying{" "}
          <span className="font-extrabold">
            {stats.min !== null && stats.max !== null && stats.min === stats.max
              ? formatGHS(stats.min)
              : stats.min !== null && stats.max !== null
                ? `${formatGHS(stats.min)} – ${formatGHS(stats.max)}`
                : "—"}
          </span>
          {askingPrice && stats.min !== null && stats.min < askingPrice ? (
            <> — that&apos;s below today&apos;s asking {formatGHS(askingPrice)}</>
          ) : null}
          .
        </p>
      )}

      <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`actual-paid-price-${productSlug}`}>
          Price you paid in cedis
        </label>
        <input
          id={`actual-paid-price-${productSlug}`}
          type="number"
          inputMode="decimal"
          min={1}
          max={10000000}
          placeholder="Price you paid (GH₵)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-40 rounded-lg border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-900 dark:text-navy-100 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
          required
        />
        <input
          type="text"
          maxLength={80}
          placeholder="Shop (optional)"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          aria-label="Shop name (optional)"
          className="w-36 rounded-lg border border-navy-100 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-navy-900 dark:text-navy-100 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-700 disabled:opacity-60"
        >
          {state === "sending" ? "Saving…" : "Report what you paid"}
        </button>
      </form>
      <p className="mt-2 text-[11px] text-slate-soft dark:text-navy-300" role="status" aria-live="polite">
        {state === "done" && "Thanks — your report appears after a quick check by our team."}
        {state === "error" && "Couldn't save that. Please try again."}
        {state === "idle" && "Only verified reports are shown — never individual submissions."}
      </p>
    </div>
  );
}
