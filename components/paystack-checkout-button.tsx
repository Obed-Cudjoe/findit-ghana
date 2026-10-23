"use client";

import { useState } from "react";

export function PaystackCheckoutButton({
  vendorSlug,
  label = "Continue to secure Paystack checkout",
}: {
  vendorSlug: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vendorSlug }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.authorizationUrl !== "string") {
        setError(typeof result.error === "string" ? result.error : "Could not open Paystack checkout. Please try again.");
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={startCheckout}
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 transition-colors hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? "Opening secure checkout…" : label}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300" role="alert">{error}</p>}
      <p className="mt-2 text-center text-xs text-slate-soft dark:text-navy-300">Your plan activates only after the payment is verified by our server.</p>
    </div>
  );
}
