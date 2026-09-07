"use client";

// "Register your shop" form (For Vendors page) — ONE form, ONE submit:
// shop signup + optional first product in the same step (a WhatsApp vendor
// goes from "hello" to "listed" in one sitting). Password is optional.
// Submits to /api/listings, which upserts the vendor profile (pending in
// /admin/vendors), optionally creates the first pending listing, and sets
// the dashboard cookie when a password was provided.
import { useState } from "react";
import Link from "next/link";
import { PLAN_LIST, MOMO_NUMBER, MOMO_NAME, MOMO_WHATSAPP, UNLIMITED_BADGE, VENDOR_PLANS, isPlanId, listingLimitLabel, type PlanId } from "@/lib/plans";
import { MIN_VENDOR_PASSWORD } from "@/lib/vendor-auth-client";
import { MIN_PHOTOS } from "@/components/image-upload-field";

// Mirrors the seed categories (client-safe — no server imports here).
const PRODUCT_CATEGORIES = [
  { slug: "phones", label: "Phones" },
  { slug: "laptops", label: "Laptops" },
  { slug: "tv-audio", label: "TVs & Audio" },
  { slug: "appliances", label: "Appliances" },
  { slug: "gaming", label: "Gaming" },
  { slug: "fashion", label: "Fashion" },
];

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-shadow";

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-navy-900 dark:text-navy-100">
        {label} {required && <span className="text-gold-600 dark:text-gold-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300" role="alert">
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
    websiteUrl: "",
    password: "",
    passwordConfirm: "",
    productName: "",
    priceGhs: "",
    category: "",
    description: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ paymentRequired: boolean; plan: PlanId; vendorSlug: string | null; loggedIn: boolean; firstListing: boolean } | null>(null);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.businessName.trim().length < 2) e.businessName = "Enter your business name";
    const digits = form.phone.replace(/[^0-9]/g, "");
    if (digits.length < 9 || digits.length > 15) e.phone = "Enter a valid phone / WhatsApp number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.password) {
      if (form.password.length < MIN_VENDOR_PASSWORD) e.password = `At least ${MIN_VENDOR_PASSWORD} characters`;
      if (form.password !== form.passwordConfirm) e.passwordConfirm = "Passwords do not match";
    }
    const wantsProduct = form.productName.trim() !== "" || form.priceGhs.trim() !== "" || form.category !== "";
    if (wantsProduct) {
      if (form.productName.trim().length < 3) e.productName = "Enter the product name (e.g. iPhone 13 128GB)";
      const priceNum = Number(form.priceGhs);
      if (!Number.isFinite(priceNum) || priceNum <= 0) e.priceGhs = "Enter the price in cedis";
      if (!PRODUCT_CATEGORIES.some((c) => c.slug === form.category)) e.category = "Pick a category";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const wantsProduct = form.productName.trim() !== "" && form.priceGhs.trim() !== "" && form.category !== "";
      let res: Response;
      if (wantsProduct) {
        const fd = new FormData();
        for (const [k, v] of Object.entries({ ...form, plan })) fd.append(k, v);
        for (const f of photos) fd.append("images", f);
        res = await fetch("/api/listings", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/listings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...form, plan }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.needsVerification) {
        setNeedsVerification(typeof data.message === "string" ? data.message : "This shop is already registered. WhatsApp us to activate your dashboard login.");
        setErrors({});
        return;
      }
      if (res.ok) {
        setDone({
          paymentRequired: !!data.paymentRequired,
          plan: isPlanId(data.plan) && data.plan !== "free" ? data.plan : "free",
          vendorSlug: typeof data.vendorSlug === "string" ? data.vendorSlug : null,
          loggedIn: !!data.loggedIn,
          firstListing: !!data.firstListing,
        });
        setErrors({});
      } else {
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (needsVerification) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-700 dark:bg-amber-900/30" role="status">
        <p className="font-extrabold text-amber-900 dark:text-amber-200">We know this shop 👋</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-900 dark:text-amber-200">{needsVerification}</p>
        <a
          href={`https://wa.me/${MOMO_WHATSAPP}?text=${encodeURIComponent("Hi, I want to activate my dashboard login on FindIt Ghana. Business: " + form.businessName + " · Phone: " + form.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-500 transition-colors"
        >
          WhatsApp us now
        </a>
      </div>
    );
  }

  if (done) {
    const dashboardHref = done.loggedIn ? "/vendor" : "/vendor/login";
    const dashboardLabel = done.loggedIn ? "Open your dashboard →" : "Sign in to your dashboard →";
    if (done.paymentRequired) {
      const picked = VENDOR_PLANS[done.plan];
      const ref = `FINDIT-${(done.vendorSlug || "SHOP").toUpperCase().slice(0, 18)}`;
      const waText = encodeURIComponent(`Hi, I just registered my shop on FindIt Ghana (${picked.name} plan). MoMo reference: ${ref}. Business: ${form.businessName}.`);
      return (
        <div className="rounded-xl border border-gold-600/40 bg-gold-500/10 p-6" role="status">
          <p className="font-extrabold text-navy-900 dark:text-navy-100">Shop registered — pay to activate {picked.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-soft dark:text-navy-300">
            Your shop is in the review queue. To unlock{" "}
            {Number.isFinite(picked.listingLimit) ? `${picked.listingLimit} listings` : "unlimited listings"}
            {picked.featuredRotation ? ", ★ featured placement" : ""}
            {picked.unlimited ? ` and the ${UNLIMITED_BADGE} badge` : ""}
            {picked.homepageFeatured ? " and a homepage shop" : ""}, send{" "}
            <strong className="text-navy-900 dark:text-navy-100">GH₵{picked.priceGhs}</strong> by Mobile Money:
          </p>
          <ol className="mt-4 space-y-2 text-sm text-navy-900 dark:text-navy-100">
            <li><span className="font-bold">1.</span> Pay <strong>GH₵{picked.priceGhs}</strong> to <strong>{MOMO_NUMBER}</strong> ({MOMO_NAME}).</li>
            <li><span className="font-bold">2.</span> Use reference <span className="rounded bg-white dark:bg-navy-900 px-1.5 py-0.5 font-mono text-xs font-bold">{ref}</span></li>
            <li>
              <span className="font-bold">3.</span> WhatsApp that reference to the same number — we confirm within a business day and your plan goes live.
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
          <p className="mt-4 text-sm font-semibold text-navy-900 dark:text-navy-100">
            You can start listing right away — until payment clears you have the Free plan ({VENDOR_PLANS.free.listingLimit} listings).
          </p>
          <p className="mt-2 text-center text-sm">
            <Link href={dashboardHref} className="font-bold text-navy-900 dark:text-navy-100 underline">{dashboardLabel}</Link>
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 p-6" role="status">
        <p className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          You&apos;re all set — your shop is registered!
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
          {done.firstListing ? (
            <>Your first product is already queued for review — our checks team usually approves within 1 business day, then it appears in search and category pages with a WhatsApp button straight to you. Add more products any time from your dashboard.</>
          ) : (
            <>Next step: <strong>sign in to your dashboard</strong> to add your first product (you&apos;ll upload at least {MIN_PHOTOS} photos per product). Every product goes to our checks team — usually reviewed within 1 business day — then appears in search and category pages with a WhatsApp button straight to you.</>
          )}
        </p>
        <p className="mt-3 text-sm">
          <Link href={dashboardHref} className="font-bold text-emerald-900 underline">{dashboardLabel}</Link>
        </p>
        <p className="mt-2 text-sm">
          <Link href="/" className="font-semibold text-emerald-900 underline">Browse the site while you wait →</Link>
        </p>
      </div>
    );
  }

  const hasProduct = form.productName.trim() !== "" && form.priceGhs.trim() !== "" && form.category !== "";
  const submitLabel = plan === "free"
    ? hasProduct ? "Register & list my product — it's free" : "Register my shop — it's free"
    : `Register & pay GH₵${VENDOR_PLANS[plan].priceGhs} via MoMo`;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300" role="alert">{serverError}</p>
      )}

      <fieldset>
        <legend className="text-sm font-bold text-navy-900 dark:text-navy-100">0 · Choose a plan</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs font-bold uppercase tracking-wide text-gold-700 dark:text-gold-500">{p.id === "free" ? "Free" : `GH₵${p.priceGhs}/mo`}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-extrabold text-navy-900 dark:text-navy-100">
                  {p.name}
                  {p.unlimited && (
                    <span className="rounded-full bg-navy-950 px-1.5 py-0.5 text-[10px] font-extrabold text-gold-400 ring-1 ring-gold-500/60">
                      {UNLIMITED_BADGE}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs font-semibold text-navy-800 dark:text-navy-200">
                  {Number.isFinite(p.listingLimit) ? `${listingLimitLabel(p.listingLimit)} listing${p.listingLimit === 1 ? "" : "s"}` : "Unlimited listings"}
                </p>
                <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">{p.tagline}</p>
                <ul className="mt-2 space-y-1 text-[11px] text-navy-800 dark:text-navy-200">
                  {p.perks.map((perk) => (
                    <li key={perk}>• {perk}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-xl bg-navy-50/70 dark:bg-navy-900/50 p-4">
        <p className="text-sm font-bold text-navy-900 dark:text-navy-100">1 · About your business</p>
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
          <Field label="TikTok or Facebook link (optional)">
            <input className={inputCls} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://tiktok.com/@your-shop or facebook.com/your-shop" />
          </Field>
        </div>
      </div>

      <div className="rounded-xl bg-gold-500/10 p-4 ring-1 ring-gold-500/30">
        <p className="text-sm font-bold text-navy-900 dark:text-navy-100">
          2 · List your first product <span className="font-normal text-slate-soft dark:text-navy-300">(optional, but takes 2 minutes — get found today)</span>
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Product name" error={errors.productName}>
            <input className={inputCls} value={form.productName} onChange={(e) => set("productName", e.target.value)} placeholder="e.g. iPhone 13 128GB, UK used" />
          </Field>
          <Field label="Price in cedis" error={errors.priceGhs}>
            <input className={inputCls} inputMode="decimal" value={form.priceGhs} onChange={(e) => set("priceGhs", e.target.value)} placeholder="e.g. 5500" />
          </Field>
          <Field label="Category" error={errors.category}>
            <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Pick a category</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label={`Photos (${photos.length} selected)`}>
            <input
              className="block w-full text-sm text-slate-soft dark:text-navy-300 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            />
            <span className="mt-1 block text-[11px] text-slate-soft dark:text-navy-300">
              {MIN_PHOTOS}+ photos sell best — but even 1 gets you live. More photos = more buyer trust.
            </span>
          </Field>
          <Field label="Short description (optional)">
            <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="e.g. Clean UK used, battery 92%, free delivery in Accra" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-soft dark:text-navy-300">
          Skip this and you can add products later from your dashboard. Every product is reviewed before it goes live — usually within 1 business day.
        </p>
      </div>

      <div className="rounded-xl bg-navy-50/70 dark:bg-navy-900/50 p-4">
        <p className="text-sm font-bold text-navy-900 dark:text-navy-100">
          3 · Dashboard login <span className="font-normal text-slate-soft dark:text-navy-300">(optional)</span>
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Dashboard password (optional)" error={errors.password}>
            <input className={inputCls} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={`At least ${MIN_VENDOR_PASSWORD} characters`} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={errors.passwordConfirm}>
            <input className={inputCls} type="password" value={form.passwordConfirm} onChange={(e) => set("passwordConfirm", e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-soft dark:text-navy-300">
          Setting a password lets you open <Link href="/vendor/login" className="font-semibold underline">/vendor</Link> to add more products, see your shop&apos;s views and manage your plan.
          <strong>No password? No problem</strong> — your shop still goes live, and you can message us any time to update your products.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 py-3.5 text-base font-bold text-navy-950 shadow hover:bg-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
      >
        {busy ? "Registering…" : submitLabel}
      </button>
      <p className="text-center text-xs text-slate-soft dark:text-navy-300">
        {hasProduct
          ? "Your first product goes to review with your shop — once approved, buyers see it with a WhatsApp button straight to you."
          : `You can also list products later from your dashboard — ${MIN_PHOTOS} photos minimum each. Your WhatsApp number appears on every listing so buyers reach you directly.`}
        {plan !== "free" && ` Paid plans start after we confirm your MoMo payment to ${MOMO_NUMBER}.`}
      </p>
    </form>
  );
}
