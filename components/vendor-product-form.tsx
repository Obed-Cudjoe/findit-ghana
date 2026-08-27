"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  ["phones", "Phones"],
  ["laptops", "Laptops"],
  ["tv-audio", "TVs & Audio"],
  ["appliances", "Appliances"],
  ["gaming", "Gaming"],
  ["fashion", "Fashion"],
] as const;

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-shadow";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-navy-900">
        {label} {required && <span className="text-gold-600">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

export function VendorProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    productName: "",
    category: "phones",
    priceGhs: "",
    stockCount: "",
    deliveryZone: "Accra",
    deliveryDaysMin: "1",
    deliveryDaysMax: "2",
    deliveryFeeGhs: "0",
    description: "",
    websiteUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.productName.trim().length < 3) e.productName = "Enter the product name";
    const price = Number(form.priceGhs);
    if (!price || price <= 0) e.priceGhs = "Enter the price in cedis (numbers only)";
    if (form.stockCount && (isNaN(Number(form.stockCount)) || Number(form.stockCount) < 0)) e.stockCount = "Numbers only";
    if (form.description.trim().length < 20) e.description = "Describe the product (at least 20 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/vendor/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          priceGhs: Number(form.priceGhs),
          stockCount: form.stockCount ? Number(form.stockCount) : null,
          deliveryDaysMin: Number(form.deliveryDaysMin) || 1,
          deliveryDaysMax: Number(form.deliveryDaysMax) || 2,
          deliveryFeeGhs: Number(form.deliveryFeeGhs) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" role="status">
        <p className="font-bold text-emerald-800">Listing received — in the review queue.</p>
        <p className="mt-1 text-sm text-emerald-800">It appears on your public shop after we approve it.</p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm({
              productName: "",
              category: "phones",
              priceGhs: "",
              stockCount: "",
              deliveryZone: "Accra",
              deliveryDaysMin: "1",
              deliveryDaysMax: "2",
              deliveryFeeGhs: "0",
              description: "",
              websiteUrl: "",
            });
          }}
          className="mt-3 text-sm font-bold text-emerald-900 underline"
        >
          Add another product
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {serverError}{" "}
          {serverError.includes("Upgrade") && (
            <Link href="/for-vendors" className="underline">See plans →</Link>
          )}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" required error={errors.productName}>
          <input className={inputCls} value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder="e.g. iPhone 13 (128GB)" />
        </Field>
        <Field label="Category" required>
          <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Price in cedis" required error={errors.priceGhs}>
          <input className={inputCls} value={form.priceGhs} onChange={(e) => set("priceGhs", e.target.value)} placeholder="e.g. 6200" inputMode="numeric" />
        </Field>
        <Field label="Units in stock (optional)" error={errors.stockCount}>
          <input className={inputCls} value={form.stockCount} onChange={(e) => set("stockCount", e.target.value)} placeholder="e.g. 14" inputMode="numeric" />
        </Field>
        <Field label="Delivery zone">
          <input className={inputCls} value={form.deliveryZone} onChange={(e) => set("deliveryZone", e.target.value)} placeholder="e.g. Accra" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Delivery (days, from)">
            <input className={inputCls} value={form.deliveryDaysMin} onChange={(e) => set("deliveryDaysMin", e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Delivery (days, to)">
            <input className={inputCls} value={form.deliveryDaysMax} onChange={(e) => set("deliveryDaysMax", e.target.value)} inputMode="numeric" />
          </Field>
        </div>
        <Field label="Delivery fee in cedis (0 if free)">
          <input className={inputCls} value={form.deliveryFeeGhs} onChange={(e) => set("deliveryFeeGhs", e.target.value)} placeholder="e.g. 45" inputMode="numeric" />
        </Field>
        <Field label="Website or Instagram (optional)">
          <input className={inputCls} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://…" />
        </Field>
      </div>
      <Field label="Description" required error={errors.description}>
        <textarea
          className={`${inputCls} min-h-24`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Condition, warranty, colour options — what should buyers know before they message you?"
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-navy-950 shadow hover:bg-gold-400 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit listing for review"}
      </button>
    </form>
  );
}
