"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { CommunityMarketForm } from "@/components/community-market-form";
import { formatGHS } from "@/lib/utils";
import type { SiteAssistantAction, SiteAssistantLink } from "@/lib/site-assistant-shared";

type ChatMessage = { role: "assistant" | "user"; text: string; links?: SiteAssistantLink[]; action?: SiteAssistantAction };

const SUGGESTIONS = [
  "Find Samsung phones under GH₵3,000",
  "Show Community Market listings",
  "Post a Community Market listing",
  "What are the seller plans?"
];

export function SiteAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showListingForm, setShowListingForm] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! I can look up FindIt catalogue prices, browse approved Community Market listings, explain seller plans, or point you to the right page." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending, open]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (pathname.startsWith("/admin") || pathname === "/vendor/login") return null;

  async function executeAction(action: SiteAssistantAction, messageIndex: number) {
    if (action.type === "open-community-listing-form") {
      setShowListingForm(true);
      return;
    }
    if (action.type !== "vendor-price-change" || actionBusy) return;
    setActionBusy(action.listingId);
    setError("");
    try {
      const response = await fetch(`/api/vendor/listings/${encodeURIComponent(action.listingId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceGhs: action.newPriceGhs }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not update that listing. Please try again in your dashboard.");
        return;
      }
      setMessages((all) => [
        ...all.map((message, index) => index === messageIndex ? { ...message, action: undefined } : message),
        { role: "assistant", text: `Updated ${action.listingTitle} to GH₵${action.newPriceGhs.toLocaleString("en-GH")}. The change is saved to your listing.` },
      ]);
    } catch {
      setError("Connection problem. Please try the update again from your vendor dashboard.");
    } finally {
      setActionBusy(null);
    }
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || sending) return;
    setDraft("");
    setError("");
    setMessages((all) => [...all, { role: "user", text }]);
    setSending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "I couldn't answer just now. Please try again.");
        return;
      }
      const action = payload.action as SiteAssistantAction | undefined;
      setMessages((all) => [...all, { role: "assistant", text: String(payload.text ?? "I couldn't find an answer."), links: Array.isArray(payload.links) ? payload.links : [], action }]);
      if (action?.type === "open-community-listing-form") setShowListingForm(true);
    } catch {
      setError("Connection problem. Try again or use the site search.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[70] flex flex-col items-end gap-3 sm:right-6">
      {open && (
        <section className="flex h-[min(72dvh,560px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-navy-900" aria-label="FindIt assistant chat" aria-live="polite">
          <header className="flex items-center justify-between bg-navy-950 px-4 py-3 text-white">
            <div>
              <p className="font-extrabold">FindIt assistant</p>
              <p className="text-[11px] text-navy-200">Search, guided listings and confirmed seller updates</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </header>
          {showListingForm ? (
            <div className="flex-1 overflow-y-auto p-3">
              <button type="button" onClick={() => setShowListingForm(false)} className="mb-3 text-xs font-bold text-navy-700 underline dark:text-navy-200">← Back to chat</button>
              <CommunityMarketForm />
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`max-w-[92%] rounded-2xl px-3 py-2.5 text-sm ${message.role === "user" ? "ml-auto bg-gold-500 text-navy-950" : "mr-auto bg-navy-50 text-navy-900 dark:bg-navy-800 dark:text-navy-100"}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    {message.links?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.links.map((link) => <Link key={`${link.href}-${link.label}`} href={link.href} onClick={() => setOpen(false)} className="rounded-full border border-navy-300 px-2.5 py-1 text-xs font-bold underline decoration-gold-500 underline-offset-2 dark:border-navy-600">{link.label} →</Link>)}</div> : null}
                    {message.action?.type === "vendor-price-change" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" disabled={actionBusy === message.action.listingId} onClick={() => void executeAction(message.action!, index)} className="rounded-lg bg-gold-500 px-3 py-2 text-xs font-extrabold text-navy-950 disabled:opacity-50">{actionBusy === message.action.listingId ? "Saving…" : `Confirm ${formatGHS(message.action.newPriceGhs)}`}</button>
                        <button type="button" onClick={() => setMessages((all) => all.map((item, itemIndex) => itemIndex === index ? { ...item, action: undefined, text: `${item.text} Cancelled.` } : item))} className="rounded-lg border border-navy-300 px-3 py-2 text-xs font-semibold">Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
                {sending && <p className="mr-auto rounded-2xl bg-navy-50 px-3 py-2 text-xs text-slate-soft dark:bg-navy-800 dark:text-navy-300">Checking FindIt data…</p>}
                <div ref={endRef} />
              </div>
              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => void ask(suggestion)} className="rounded-full border border-navy-200 px-2.5 py-1.5 text-[11px] font-semibold text-navy-800 hover:border-gold-500 dark:border-navy-700 dark:text-navy-200">{suggestion}</button>)}</div>
              )}
              {error && <p className="px-3 pb-2 text-xs font-semibold text-red-700 dark:text-red-300" role="alert">{error}</p>}
              <form onSubmit={handleSubmit} className="flex gap-2 border-t border-navy-100 p-3 dark:border-navy-800">
                <label className="sr-only" htmlFor="findit-assistant-message">Ask FindIt</label>
                <input id="findit-assistant-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={300} placeholder="Ask a question…" className="min-w-0 flex-1 rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-gold-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white" />
                <button type="submit" disabled={!draft.trim() || sending} aria-label="Send question" className="rounded-xl bg-gold-500 px-3 text-navy-950 disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </form>
            </>
          )}
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close FindIt assistant" : "Open FindIt assistant"} className="flex items-center gap-2 rounded-full bg-gold-500 px-4 py-3 text-sm font-extrabold text-navy-950 shadow-lg hover:bg-gold-400">
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>{open ? "Close" : "Ask FindIt"}</span>
      </button>
    </div>
  );
}
