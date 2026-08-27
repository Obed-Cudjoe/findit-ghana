"use client";

// "List your product" form (For Vendors page).
// Submits to /api/listings → admin queue → appears on the site once approved.
// Paid plans show MoMo instructions after submit; admin confirms in /admin/vendors.
import { useState } from "react";
import Link from "next/link";
import { PLAN_LIST, MOMO_NUMBER, MOMO_NAME, MOMO_WHATSAPP, VENDOR_PLANS, type PlanId } from "@/lib/plans";

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
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          {error}
        </span>
      )}
    </label>
  );
}

export function VendorListingForm() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
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
  const [done, setDone] = useState<{ paymentRequired: boolean; plan: PlanId; vendorSlug: string | null } | null>(null);
  const [serverError, setServerError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.businessName.trim().length < 2) e.businessName = "Enter your business name";
    const digits = form.phone.replace(/[^0-9]/g, "");
    if (digits.length < 9 || digits.length > 15) e.phone = "Enter a valid phone / WhatsApp number";
    if (form.productName.trim().length < 3) e.productName = "Enter the product name";
    const price = Number(form.priceGhs);
    if (!price || price <= 0) e.priceGhs = "Enter the price in cedis (numbers only)";
    if (form.stockCount && (isNaN(Number(form.stockCount)) || Number(form.stockCount) < 0)) e.stockCount = "Numbers only";
    if (form.description.trim().length < 20) e.description = "Describe the product (at least 20 characters)";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          plan,
          priceGhs: Number(form.priceGhs),
          stockCount: form.stockCount ? Number(form.stockCount) : null,
          deliveryDaysMin: Number(form.deliveryDaysMin) || 1,
          deliveryDaysMax: Number(form.deliveryDaysMax) || 2,
          deliveryFeeGhs: Number(form.deliveryFeeGhs) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({
          paymentRequired: !!data.paymentRequired,
          plan: data.plan === "starter" || data.plan === "pro" ? data.plan : "free",
          vendorSlug: typeof data.vendorSlug === "string" ? data.vendorSlug : null,
        });
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
    if (done.paymentRequired) {
      const picked = VENDOR_PLANS[done.plan];
      const ref = `FINDIT-${(done.vendorSlug || "SHOP").toUpperCase().slice(0, 18)}`;
      const waText = encodeURIComponent(`Hi, I just listed on FindIt Ghana (${picked.name} plan). MoMo reference: ${ref}. Business: ${form.businessName}.`);
      return (
        <div className="rounded-xl border border-gold-600/40 bg-gold-500/10 p-6" role="status">
          <p className="font-extrabold text-navy-900">Listing received — pay to activate {picked.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-soft">
            Your product is in the review queue. To unlock {picked.listingLimit} listings
            {picked.featuredRotation ? ", ★ featured placement" : ""}
            {picked.homepageFeatured ? " and a homepage shop" : ""}, send{" "}
            <strong className="text-navy-900">GH₵{picked.priceGhs}</strong> by Mobile Money:
          </p>
          <ol className="mt-4 space-y-2 text-sm text-navy-900">
            <li><span className="font-bold">1.</span> Pay <strong>GH₵{picked.priceGhs}</strong> to <strong>{MOMO_NUMBER}</strong> ({MOMO_NAME}).</li>
            <li><span className="font-bold">2.</span> Use reference <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold">{ref}</span></li>
            <li>
              <span className="font-bold">3.</span> WhatsApp that reference to the same number — we confirm within a business day and your shop goes live.
            </li>
          </ol>
          <a
            href={`https://wa.me/${MOMO_WHATSAPP}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gold-500 px-5 py-3 text-sm font-bold text-navy-950 hover:bg-gold-400 transition-colors"
          >
            WhatsApp {MOMO_NUMBER} with my reference
          </a>
          <p className="mt-3 text-center text-xs text-slate-soft">
            Until payment clears you still have the Free plan (1 listing).{" "}
            <Link href="/" className="font-semibold text-navy-800 underline">Browse the site while you wait →</Link>
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <p className="flex items-center gap-2 font-bold text-emerald-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          Listing received!
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          Our checks team reviews every listing — usually within 1 business day. Once approved, your product appears in
          search and category pages with a WhatsApp contact link straight to you.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/" className="font-semibold text-emerald-900 underline">Browse the site while you wait →</Link>
        </p>
      </div>
    );
  }

  const submitLabel = plan === "free"
    ? "Submit listing — it's free"
    : `Submit & pay GH₵${VENDOR_PLANS[plan].priceGhs} via MoMo`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{serverError}</p>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-navy-900">0 · Choose a plan</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PLAN_LIST.map((p) => {
            const selected = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                aria-pressed={selected}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-gold-500 bg-gold-500/15 ring-2 ring-gold-500/40"
                    : "border-navy-100 bg-white hover:border-gold-400"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-gold-700">{p.id === "free" ? "Free" : `GH₵${p.priceGhs}/mo`}</p>
                <p className="mt-0.5 font-extrabold text-navy-900">{p.name}</p>
                <p className="mt-1 text-xs text-slate-soft">{p.tagline}</p>
                <ul className="mt-2 space-y-1 text-[11px] text-navy-800">
                  {p.perks.map((perk) => (
                    <li key={perk}>• {perk}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-xl bg-navy-50/70 p-4">
        <p className="text-sm font-bold text-navy-900">1 · About your business</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Business name" required error={errors.businessName}>
            <input className={inputCls} value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Ama's Gadgets" />
          </Field>
          <Field label="Contact name">
            <input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Who buyers talk to" />
          </Field>
          <Field label="Phone / WhatsApp" required error={errors.phone}>
            <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 024 000 0000" inputMode="tel" />
          </Field>
          <Field label="Email (optional)" error={errors.email}>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </Field>
        </div>
      </div>

      <div className="rounded-xl bg-navy-50/70 p-4">
        <p className="text-sm font-bold text-navy-900">2 · About the product</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
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
        <div className="mt-4">
          <Field label="Description" required error={errors.description}>
            <textarea
              className={`${inputCls} min-h-24`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Condition, warranty, colour options — what should buyers know before they message you?"
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-navy-950 shadow hover:bg-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        {busy ? "Submitting…" : submitLabel}
      </button>
      <p className="text-center text-xs text-slate-soft">
        Your WhatsApp number appears on the listing so buyers can reach you directly. We review every listing before it goes live.
        {plan !== "free" && ` Paid plans start after we confirm your MoMo payment to ${MOMO_NUMBER}.`}
      </p>
    </form>
  );
}
