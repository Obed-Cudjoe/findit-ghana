"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setError("Wrong password. Try again.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-navy-900">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-navy-200 px-3 py-2.5 text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800 active:scale-[0.98] disabled:opacity-60 transition-all"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
