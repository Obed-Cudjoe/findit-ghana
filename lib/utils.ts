// Shared utilities — GHS formatting, slugs, ref codes, dates.
export function formatGHS(n: number): string {
  return "GH₵" + n.toLocaleString("en-GH", { maximumFractionDigits: 0 });
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function makeRefCode(): string {
  // GH-48213 style reference shown to reporters (COMP-14).
  return "GH-" + Math.floor(10000 + Math.random() * 90000);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function deliveryLabel(o: { deliveryDaysMin: number; deliveryDaysMax: number; deliveryZone: string }): string {
  const days = o.deliveryDaysMin === o.deliveryDaysMax
    ? `${o.deliveryDaysMin} day${o.deliveryDaysMin > 1 ? "s" : ""}`
    : `${o.deliveryDaysMin}–${o.deliveryDaysMax} days`;
  return `${o.deliveryZone} · ${days}`;
}
