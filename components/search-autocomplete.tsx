"use client";

// F01 — search bar with live autocomplete.
// Debounced fetch to /api/search/suggest; dropdown shows product name,
// best price in cedis and category. Keyboard: arrows + Enter + Escape.
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Smartphone, ArrowRight } from "lucide-react";
import { formatGHS } from "@/lib/utils";

interface Suggestion {
  slug: string;
  name: string;
  category: string;
  minPriceGhs: number | null;
}

export function SearchAutocomplete({
  variant = "compact",
  initialQuery = "",
  onNavigate,
}: {
  variant?: "compact" | "hero";
  initialQuery?: string;
  /** called after a suggestion is chosen (mobile menu uses it to close itself) */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const inputId = useId(); // unique per instance — header and mobile menu both render a compact bar
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onInput(q: string) {
    setValue(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        /* suggestions are a convenience — silence network errors */
      } finally {
        setBusy(false);
      }
    }, 220);
  }

  function go(slug: string, name: string) {
    // category suggestions ("All Phones") go to the category page
    setOpen(false);
    if (slug.startsWith("all-") || ["phones", "laptops", "tv-audio", "appliances", "gaming", "fashion"].includes(slug)) {
      router.push(`/category/${slug}`);
    } else {
      router.push(`/product/${slug}`);
    }
    setValue(name.replace(/^All /, ""));
    onNavigate?.();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    if (value.trim()) router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const s = suggestions[active];
      go(s.slug, s.name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const isHero = variant === "hero";

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search">
        <label htmlFor={inputId} className="sr-only">Search prices in Ghana</label>
        <div
          className={`flex items-center overflow-hidden ${
            isHero
              ? "rounded-2xl bg-white shadow-2xl ring-1 ring-navy-700 focus-within:ring-2 focus-within:ring-gold-500"
              : "rounded-full bg-navy-800 focus-within:ring-2 focus-within:ring-gold-500"
          }`}
        >
          <span className={`${isHero ? "pl-4 text-slate-soft" : "pl-3.5 text-navy-300"}`} aria-hidden="true">
            <Search className={isHero ? "h-5 w-5" : "h-4 w-4"} />
          </span>
          <input
            id={inputId}
            type="search"
            value={value}
            autoComplete="off"
            placeholder={isHero ? "Try “iphone 13” or “4-burner gas cooker”…" : "Search prices in Ghana…"}
            className={`w-full bg-transparent focus:outline-none ${
              isHero
                ? "px-3 py-4 text-base text-ink placeholder:text-slate-400 md:text-base"
                : "px-3 py-2.5 text-base text-white placeholder:text-navy-300"
            }`}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => value.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
          />
          <button
            type="submit"
            className={`shrink-0 font-bold transition-colors ${
              isHero
                ? "bg-gold-500 px-6 py-4 text-sm text-navy-950 hover:bg-gold-400"
                : "bg-gold-500 px-4 py-2.5 text-sm text-navy-950 hover:bg-gold-400"
            }`}
          >
            Search
          </button>
        </div>
      </form>

      {/* suggestions dropdown — opaque, scrollable, above every other layer */}
      {open && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute inset-x-0 top-full z-[70] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-navy-100 bg-white shadow-2xl"
        >
          {busy && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-soft">Searching…</li>
          )}
          {!busy && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-soft">No matches — press Search to see all results.</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.slug}-${i}`}>
              <button
                type="button"
                onClick={() => go(s.slug, s.name)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === active ? "bg-navy-50" : "bg-white"
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy-900">{s.name}</span>
                  <span className="block text-xs capitalize text-slate-soft">{s.category.replace("-", " & ")}</span>
                </span>
                {s.minPriceGhs !== null && (
                  <span className="shrink-0 text-sm font-bold text-gold-700">{formatGHS(s.minPriceGhs)}</span>
                )}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-navy-300" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
