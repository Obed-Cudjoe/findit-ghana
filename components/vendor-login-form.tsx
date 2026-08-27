"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MIN_VENDOR_PASSWORD } from "@/lib/vendor-auth-client";

const inputCls =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30";

export function VendorLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "set">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "set") {
      if (password.length < MIN_VENDOR_PASSWORD) {
        setError(`Password must be at least ${MIN_VENDOR_PASSWORD} characters.`);
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }
    setBusy(true);
    try {
      const url = mode === "login" ? "/api/vendor/login" : "/api/vendor/password";
      const body =
        mode === "login"
          ? { phone, password }
          : { phone, password, businessName };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace(nextPath || "/vendor");
        router.refresh();
        return;
      }
      if (data.code === "no_password") {
        setMode("set");
      }
      setError(typeof data.error === "string" ? data.error : "Could not sign in.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-navy-50 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); }}
          className={`rounded-md px-3 py-2 ${mode === "login" ? "bg-white text-navy-900 shadow-sm" : "text-slate-soft"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode("set"); setError(""); }}
          className={`rounded-md px-3 py-2 ${mode === "set" ? "bg-white text-navy-900 shadow-sm" : "text-slate-soft"}`}
        >
          Create login
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-navy-900">Phone / WhatsApp</span>
        <input
          className={inputCls}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 024 000 0000"
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </label>

      {mode === "set" && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-navy-900">Business name</span>
          <input
            className={inputCls}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Exactly as you listed it"
            autoComplete="organization"
            required
          />
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-navy-900">Password</span>
        <input
          type="password"
          className={inputCls}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      {mode === "set" && (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-navy-900">Confirm password</span>
          <input
            type="password"
            className={inputCls}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800 active:scale-[0.98] disabled:opacity-60 transition-all"
      >
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create login & continue"}
      </button>

      <p className="text-center text-xs text-slate-soft">
        {mode === "set"
          ? "Only for shops that listed before dashboard login existed. New listings set a password on For vendors."
          : "No shop yet?"}{" "}
        <Link href="/for-vendors" className="font-semibold text-navy-800 underline">List a product →</Link>
      </p>
    </form>
  );
}
