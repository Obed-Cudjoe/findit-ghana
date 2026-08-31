"use client";

// Price-drop alert form (product page). Shopper enters their WhatsApp
// number + target price; POSTs to /api/alerts. Delivery is explained
// honestly in the copy: we message you on WhatsApp when it drops.
import { useState } from "react";
import { BellRing } from "lucide-react";
import { formatGHS } from "@/lib/utils";

export function PriceAlertForm({
  productSlug,
  productName,
  currentPrice,
}: {
  productSlug: string;
  productName: string;
  currentPrice?: number;
}) {
  const [phone, setPhone] = useState("");
  const [target, setTarget] = useState(currentPrice ? String(Math.floor(currentPrice * 0.9)) : "");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/[^0-9]/g, "");
    if (digits.length < 9) {
      setError("Enter a valid WhatsApp number.");
      return;
    }
    const t = Number(target);
    if (!t || t <= 0) {
      setError("Enter your target price in cedis.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, phone: digits, targetPriceGhs: Math.round(t) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Could not save the alert — try again.");
      }
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 p-4" role="status">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
          <BellRing className="h-4 w-4" /> Alert set!
        </p>
        <p className="mt-1 text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
          We&apos;ll message you on WhatsApp when {productName} reaches your target price.
          Prices are checked daily, so the message arrives the morning after a drop.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-navy-900 dark:text-navy-100">
        <BellRing className="h-4 w-4 text-gold-700 dark:text-gold-500" />
        Price-drop alert
      </p>
      <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">
        {currentPrice ? `Today's best price is ${formatGHS(currentPrice)}. Set your target — we'll WhatsApp you when it drops.` : "Set your target price — we'll WhatsApp you when it drops."}
      </p>
      <form onSubmit={submit} noValidate className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`alert-phone-${productSlug}`}>WhatsApp number</label>
        <input
          id={`alert-phone-${productSlug}`}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp number — 024 000 0000"
          className="min-w-0 flex-1 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2.5 text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
        />
        <label className="sr-only" htmlFor={`alert-target-${productSlug}`}>Target price in cedis</label>
        <input
          id={`alert-target-${productSlug}`}
          type="number"
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target GH₵"
          className="w-32 rounded-lg border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2.5 text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-bold text-navy-950 hover:bg-gold-400 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {busy ? "Setting…" : "Set alert"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300" role="alert">{error}</p>}
    </div>
  );
}
