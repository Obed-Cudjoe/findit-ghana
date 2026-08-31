"use client";

import { useState } from "react";

interface GuideInput {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
}

export function Editor({ guides }: { guides: GuideInput[] }) {
  const [selected, setSelected] = useState<GuideInput>(guides[0]);
  const [excerpt, setExcerpt] = useState(guides[0]?.excerpt ?? "");
  const [body, setBody] = useState(guides[0]?.body ?? "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function pick(slug: string) {
    const g = guides.find((x) => x.slug === slug);
    if (!g) return;
    setSelected(g);
    setExcerpt(g.excerpt);
    setBody(g.body);
    setSaved(false);
    setError("");
  }

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/guides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selected.slug, excerpt, body }),
      });
      if (res.ok) setSaved(true);
      else setError("Could not save — try again.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (guides.length === 0) {
    return <p className="text-sm text-slate-soft dark:text-navy-300">No guides available.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* page list */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-3 lg:flex-col lg:gap-0 lg:space-y-1 lg:overflow-visible">
        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-soft dark:text-navy-300">Guides</p>
        {guides.map((g) => (
          <button
            key={g.slug}
            onClick={() => pick(g.slug)}
            className={`block w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors lg:whitespace-normal ${selected?.slug === g.slug ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50"}`}
          >
            {g.title}
          </button>
        ))}
        <p className="mt-3 hidden px-2 pt-3 text-xs leading-relaxed text-slate-400 border-t border-navy-100 dark:border-navy-800 lg:block">
          Static pages (About, How It Works, Trust, Privacy, Terms) live in <code>app/</code> as committed files — edit them in the repo. Guides are editable here.
        </p>
      </div>

      {/* editor panel */}
      <div className="space-y-4 rounded-xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5">
        <div>
          <p className="mb-1 text-sm font-semibold text-navy-900 dark:text-navy-100">Editing: {selected?.title}</p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-soft dark:text-navy-300">Excerpt</span>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 px-3 py-2.5 text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30" rows={2} />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-soft dark:text-navy-300">Body (## for headings)</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 px-3 py-2.5 font-mono text-base focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30" rows={14} />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={busy} className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-navy-800 active:scale-[0.98] disabled:opacity-60 transition-all">
            {busy ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Saved ✓ (goes live on the next refresh — instant once Supabase is connected)</span>}
          {error && <span className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</span>}
        </div>
      </div>
    </div>
  );
}
