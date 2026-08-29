"use client";

// Mobile hamburger menu — closes itself on navigation, Escape, and link taps.
// (The old pure-CSS checkbox toggle stayed open after client-side navigation,
// because nothing reset the checkbox when Next.js swapped the page.)

import Link from "next/link";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS: [string, string][] = [
  ["/category/phones", "Phones"],
  ["/category/laptops", "Laptops"],
  ["/category/tv-audio", "TVs & Audio"],
  ["/category/appliances", "Appliances"],
  ["/category/gaming", "Gaming"],
  ["/guides", "Price guides"],
  ["/vendors", "Vendors"],
  ["/for-vendors", "For vendors — sell your products"],
  ["/vendor/login", "Vendor login"],
  ["/how-it-works", "How it works"],
  ["/trust", "How we stay honest"],
  ["/about", "About"],
  ["/contact", "Contact"],
  ["/report/price", "Report a price error"],
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Any navigation (back/forward included) closes the menu.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes it too.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="ml-auto lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg hover:bg-navy-800 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-navy-800 bg-navy-900 shadow-2xl">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" aria-label="Mobile navigation">
            <div className="mb-2"><SearchAutocomplete variant="compact" /></div>
            {LINKS.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-navy-100 hover:bg-navy-800 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
