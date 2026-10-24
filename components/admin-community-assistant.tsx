"use client";

import { FormEvent, useState } from "react";
import type { CommunityListingStatus } from "@/lib/community-market-categories";

type ProposedAction = { listingId: string; listingTitle: string; status: CommunityListingStatus };
type Message = { role: "admin" | "assistant"; text: string; action?: ProposedAction };

export function AdminCommunityAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "I can summarize pending community listings or prepare an approval/rejection. I will always wait for your confirmation before changing a listing." },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    setMessages((all) => [...all, { role: "admin", text: text.trim() }]);
    setDraft("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/community-market/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not process that request.");
        return;
      }
      setMessages((all) => [...all, { role: "assistant", text: String(result.text ?? "No response."), action: result.action }]);
    } catch {
      setError("Connection problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmAction(messageIndex: number, action: ProposedAction) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/community-market/${encodeURIComponent(action.listingId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: action.status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not update the listing.");
        return;
      }
      setMessages((all) => [
        ...all.map((message, index) => index === messageIndex ? { ...message, action: undefined } : message),
        { role: "assistant", text: `Done. “${action.listingTitle}” is now ${action.status}.` },
      ]);
    } catch {
      setError("Connection problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <section className="mb-6 rounded-xl border border-gold-400/60 bg-gold-500/5 p-4" aria-label="Admin Community Market assistant">
      <h2 className="font-extrabold text-navy-900 dark:text-white">Admin review assistant</h2>
      <p className="mt-1 text-xs text-slate-soft dark:text-navy-300">Protected admin tool. Ask for pending listings, or prepare an approve/reject action. You confirm each change.</p>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {messages.slice(-5).map((message, index) => {
          const messageIndex = messages.length - Math.min(messages.length, 5) + index;
          return (
            <div key={`${message.role}-${messageIndex}`} className={`rounded-lg px-3 py-2 text-sm ${message.role === "admin" ? "ml-6 bg-navy-100 text-navy-900 dark:bg-navy-800 dark:text-white" : "mr-6 bg-white text-navy-900 dark:bg-navy-950 dark:text-navy-100"}`}>
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.action && <button type="button" disabled={busy} onClick={() => void confirmAction(messageIndex, message.action!)} className="mt-2 rounded-lg bg-gold-500 px-3 py-2 text-xs font-extrabold text-navy-950 disabled:opacity-50">Confirm {message.action.status}</button>}
            </div>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300" role="alert">{error}</p>}
      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="admin-community-assistant-input">Ask about community listings</label>
        <input id="admin-community-assistant-input" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={240} placeholder="e.g. show pending / approve used HP laptop" className="min-w-0 flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-gold-500 dark:border-navy-700 dark:bg-navy-950 dark:text-white" />
        <button type="submit" disabled={!draft.trim() || busy} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Working…" : "Ask"}</button>
      </form>
    </section>
  );
}
