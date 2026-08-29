"use client";

// PWA install prompt (COMP — add-to-home-screen).
// - Android/Chrome: listens for beforeinstallprompt and offers a one-tap
//   Install button when the browser fires it.
// - iOS Safari: no beforeinstallprompt exists, so after a few seconds on
//   iOS we show the Share → Add to Home Screen hint instead.
// Hides itself once installed or dismissed.
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let iosTimer: ReturnType<typeof setTimeout> | undefined;

    function onBeforeInstall(e: Event) {
      e.preventDefault(); // keep Chrome from auto-showing its own banner
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    function onInstalled() {
      setDeferred(null);
      setHidden(true);
    }
    window.addEventListener("appinstalled", onInstalled);

    // iOS path: no beforeinstallprompt — show the Share hint once.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isIos && !standalone) {
      iosTimer = setTimeout(() => setShowIosHint(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setDeferred(null);
      setHidden(true);
    }
  }

  if (hidden) return null;
  if (!deferred && !showIosHint) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-2xl ring-1 ring-navy-700">
        {deferred ? (
          <>
            <Download className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" />
            <p className="text-sm">Install FindIt Ghana on your phone</p>
            <button
              type="button"
              onClick={install}
              className="shrink-0 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-bold text-navy-950 hover:bg-gold-400 transition-colors"
            >
              Install
            </button>
          </>
        ) : (
          <p className="text-xs leading-relaxed">
            Install this app: tap <strong>Share</strong> <span aria-hidden="true">→</span>{" "}
            <strong>Add to Home Screen</strong>
          </p>
        )}
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-md p-1 text-navy-300 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
