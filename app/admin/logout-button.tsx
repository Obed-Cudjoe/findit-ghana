"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-navy-200 dark:border-navy-700 px-4 py-2 text-sm font-semibold text-navy-700 dark:text-navy-300 hover:border-red-300 hover:text-red-700 transition-colors"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
