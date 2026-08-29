"use client";

// Registers the service worker (production only — dev builds skip it so
// caching never hides live changes during development).
import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is progressive — never block the page on it */
      });
    }
  }, []);
  return null;
}
