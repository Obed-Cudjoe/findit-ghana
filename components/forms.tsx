// Forms used across the site — all submit to real API routes and store
// submissions in the database (Supabase when configured, JSON demo store
// otherwise). Every form validates inline and preserves input on errors.

"use client";

import { useState } from "react";
import Link from "next/link";

/* shared field wrapper: label + input + inline error */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-navy-900">{label}</span>
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

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 transition-shadow";

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-6 py-3 text-sm font-bold text-white shadow hover:bg-navy-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
    >
      {busy && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {busy ? "Sending…" : label}
    </button>
  );
}

function SuccessPanel({ refCode, promise }: { refCode?: string; promise: string }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6" role="status">
      <p className="flex items-center gap-2 font-bold text-emerald-800">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
        Report received{refCode ? ` — ref ${refCode}` : ""}
      </p>
      <p className="mt-2 text-sm text-emerald-800">{promise}</p>
    </div>
  );
}

/* ---------- Contact form (P12) ---------- */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "General question", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (form.message.trim().length < 10) e.message = "Write a short message (at least 10 characters)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <SuccessPanel promise="Thanks — we reply within 2 business days." />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{serverError}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" error={errors.name}>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ama Mensah" autoComplete="name" />
        </Field>
        <Field label="Email *" error={errors.email}>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" />
        </Field>
      </div>
      <Field label="What's it about?">
        <select className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
          <option>General question</option>
          <option>Press</option>
          <option>Vendors &amp; partnerships</option>
          <option>Report a problem</option>
        </select>
      </Field>
      <Field label="Message *" error={errors.message}>
        <textarea className={`${inputCls} min-h-32`} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
      </Field>
      <SubmitButton busy={busy} label="Send message" />
    </form>
  );
}

/* ---------- Report form (P13/P14) — two configurations ---------- */
export type ReportKind = "price_error" | "stock_error" | "delivery_error" | "other" | "suspicious";

export function ReportForm({ kind }: { kind: "price" | "suspicious" }) {
  const [form, setForm] = useState({
    kind: (kind === "price" ? "price_error" : "suspicious") as ReportKind,
    listingUrl: "",
    vendorName: "",
    detail: "",
    reporterEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ refCode: string } | null>(null);
  const [serverError, setServerError] = useState("");

  const kinds = kind === "price"
    ? [
        ["price_error", "Price is wrong"],
        ["stock_error", "Stock level is wrong"],
        ["delivery_error", "Delivery info is wrong"],
        ["other", "Something else"],
      ]
    : [
        ["suspicious", "Didn't deliver after payment"],
        ["suspicious", "Counterfeit or fake item"],
        ["suspicious", "Refused a refund"],
        ["other", "Something else"],
      ];

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (form.listingUrl.trim().length < 5) e.listingUrl = "Add the listing link (or the vendor's page URL)";
    if (kind === "suspicious" && form.vendorName.trim().length < 2) e.vendorName = "Add the vendor's name";
    if (form.detail.trim().length < 10) e.detail = "Describe what happened (at least 10 characters)";
    if (form.reporterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reporterEmail)) e.reporterEmail = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setServerError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <SuccessPanel
        refCode={result.refCode}
        promise={kind === "price"
          ? "We'll check it within 1 business day and fix or remove the listing."
          : "Every report is reviewed by our checks team. Thank you for keeping shoppers safe."}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {serverError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{serverError}</p>
      )}
      {kind === "suspicious" && (
        <Field label="Vendor name *" error={errors.vendorName}>
          <input className={inputCls} value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="e.g. Declutter Haven Lagos" />
        </Field>
      )}
      <Field label="Listing / profile link *" error={errors.listingUrl}>
        <input className={inputCls} value={form.listingUrl} onChange={(e) => setForm({ ...form, listingUrl: e.target.value })} placeholder="Paste the product or vendor page URL" />
      </Field>
      <fieldset>
        <legend className="mb-1 block text-sm font-semibold text-navy-900">What&apos;s wrong? *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {kinds.map(([value, label], i) => (
            <label key={i} className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy-200 px-3 py-2.5 text-sm hover:border-gold-500 transition-colors">
              <input
                type="radio"
                name="kind"
                className="h-4 w-4 accent-gold-600"
                checked={i === 0} // first option selected by default; detail text carries the specifics
                onChange={() => setForm({ ...form, kind: value as ReportKind })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Tell us what happened *" error={errors.detail}>
        <textarea className={`${inputCls} min-h-28`} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="What did you see, and what should it be?" />
      </Field>
      <Field label="Your email (optional, for updates)" error={errors.reporterEmail}>
        <input className={inputCls} type="email" value={form.reporterEmail} onChange={(e) => setForm({ ...form, reporterEmail: e.target.value })} placeholder="you@example.com" autoComplete="email" />
      </Field>
      <SubmitButton busy={busy} label="Send report" />
      <p className="text-xs text-slate-soft">
        Prefer email? Write to <Link className="text-navy-700 underline" href="/contact">our contact page</Link> — reports land in the same checks queue.
      </p>
    </form>
  );
}
