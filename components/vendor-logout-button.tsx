"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VendorLogOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/vendor/logout", { method: "POST" });
    router.replace("/vendor/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-700 hover:border-red-300 hover:text-red-700 transition-colors"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
