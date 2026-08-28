"use client";

// Photo picker used by both vendor listing forms (shop dashboard +
// /for-vendors). Enforces the same rules the server enforces (3–6 photos,
// JPG/PNG/WebP, 3 MB each) so vendors get feedback before hitting submit.
import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 6;
const MAX_BYTES = 3 * 1024 * 1024;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProductImageUpload({
  photos,
  onChange,
  error,
}: {
  photos: File[];
  onChange: (next: File[]) => void;
  error?: string;
}) {
  const [localError, setLocalError] = useState("");
  // Object URLs are derived from the File list; revoke anything that leaves.
  const urlsRef = useRef<Map<File, string>>(new Map());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const prev = urlsRef.current;
    const next = new Map<File, string>();
    for (const file of photos) next.set(file, prev.get(file) ?? URL.createObjectURL(file));
    for (const [file, url] of prev) if (!photos.includes(file)) URL.revokeObjectURL(url);
    urlsRef.current = next;
    setVersion((v) => v + 1);
  }, [photos]);

  useEffect(
    () => () => {
      for (const url of urlsRef.current.values()) URL.revokeObjectURL(url);
    },
    [],
  );

  function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setLocalError("");
    const next = [...photos];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) {
        setLocalError(`Use ${MAX_PHOTOS} photos or fewer — remove one first.`);
        break;
      }
      if (!ACCEPTED.has(file.type)) {
        setLocalError(`"${file.name}" is not a photo — use a JPG, PNG or WebP file.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setLocalError(`"${file.name}" is over 3 MB — compress it and try again.`);
        continue;
      }
      if (next.some((p) => p.name === file.name && p.size === file.size)) continue;
      next.push(file);
    }
    onChange(next);
  }

  function remove(file: File) {
    setLocalError("");
    onChange(photos.filter((p) => p !== file));
  }

  const shownError = error || localError;
  void version; // re-render trigger for the derived object URLs

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-navy-900">
          Product photos <span className="text-gold-600">*</span>
        </span>
        <span
          className={`text-xs font-semibold ${photos.length >= MIN_PHOTOS ? "text-emerald-700" : "text-slate-soft"}`}
          aria-live="polite"
        >
          {photos.length} of {MAX_PHOTOS} — at least {MIN_PHOTOS} required
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((file, i) => (
          <div key={`${file.name}-${file.size}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-navy-200 bg-navy-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlsRef.current.get(file)} alt={`Photo ${i + 1} of ${file.name}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-navy-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                Cover
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(file)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-navy-900 shadow hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-navy-200 bg-navy-50/50 p-2 text-center transition-colors hover:border-gold-500 hover:bg-gold-500/5">
            <Camera className="h-5 w-5 text-slate-soft" />
            <span className="text-[11px] font-semibold leading-tight text-slate-soft">Add photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                onPick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-soft">
        Show the product from at least 3 angles — buyers view them before contacting you. JPG, PNG or WebP · max 3 MB each.
      </p>
      {shownError && (
        <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}
