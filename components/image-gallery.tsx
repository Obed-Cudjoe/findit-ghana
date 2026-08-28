"use client";

// Buyer-facing photo gallery for vendor listings: main image + thumbnail
// strip + a minimal lightbox (prev/next, Esc or backdrop click to close).
// Plain <img> on purpose — same convention as ProductVisual, so photos load
// straight from their source (CDN / /uploads) with no image-optimization cost.
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageGallery({ images, name, className = "" }: { images: string[]; name: string; className?: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);
  const next = useCallback(() => setActive((a) => (a + 1) % count), [count]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  if (count === 0) return null;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setLightbox(true)}
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-md"
        aria-label={`Open photo ${active + 1} of ${count} of ${name} full screen`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={`${name} — photo ${active + 1} of ${count}`} className="h-full w-full object-contain" />
        {count > 1 && (
          <>
            <span className="absolute bottom-2 right-2 rounded-full bg-navy-950/75 px-2.5 py-1 text-[11px] font-bold text-white">
              {active + 1} / {count}
            </span>
            <span className="absolute inset-x-0 bottom-2 left-2 hidden gap-1.5 sm:flex">
              {images.map((src, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i === active ? "bg-gold-500" : "bg-white/60"}`} />
              ))}
            </span>
          </>
        )}
      </button>

      {count > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photos of the product">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all ${
                i === active ? "border-gold-500 ring-2 ring-gold-500/30" : "border-navy-100 opacity-75 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — photo ${active + 1} of ${count}`}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close photos"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={`${name} — photo ${active + 1} of ${count}`}
            className="max-h-[85vh] max-w-full rounded-xl bg-white object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
