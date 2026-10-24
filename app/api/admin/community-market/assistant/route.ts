import { NextResponse, type NextRequest } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { readCommunityMarketListings } from "@/lib/community-market";
import type { CommunityListingStatus } from "@/lib/community-market-categories";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`admin-community-assistant:${clientIp(request)}`, 30, 10 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Please wait a few minutes before asking again." }, { status: 429 });

  let body: { message?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Type a short request." }, { status: 400 }); }
  if (typeof body.message !== "string" || !body.message.trim()) return NextResponse.json({ error: "Type a request first." }, { status: 400 });

  const q = body.message.trim().slice(0, 240).toLowerCase();
  const listings = await readCommunityMarketListings({ includeHidden: true });
  const pending = listings.filter((item) => item.status === "pending");

  if (/\b(pending|queue|waiting|review)\b/.test(q) && !/\b(approve|reject)\b/.test(q)) {
    if (!pending.length) return NextResponse.json({ text: "There are no community listings waiting for review." });
    const summary = pending.slice(0, 8).map((item) => `• ${item.title} — GH₵${item.priceGhs.toLocaleString("en-GH")} · ${item.sellerName}`).join("\n");
    return NextResponse.json({ text: `${pending.length} listing${pending.length === 1 ? "" : "s"} pending review:\n${summary}` });
  }

  const status: CommunityListingStatus | null = /\breject\b/.test(q) ? "rejected" : /\bapprove\b/.test(q) ? "approved" : null;
  if (!status) return NextResponse.json({ text: "I can summarize pending listings or prepare an approval/rejection for you to confirm. Try ‘show pending’ or ‘approve [item name]’." });

  const target = q.replace(/\b(?:please|approve|reject|the|listing|community|market|item)\b/g, " ").replace(/\s+/g, " ").trim();
  if (!target) return NextResponse.json({ text: `Name the listing you want to ${status}. I will ask you to confirm before changing its status.` });
  const tokens = target.split(" ").filter((token) => token.length > 1);
  const matches = pending.filter((item) => {
    const title = item.title.toLowerCase();
    return title.includes(target) || tokens.every((token) => title.includes(token));
  });
  if (matches.length !== 1) return NextResponse.json({ text: matches.length ? `I found ${matches.length} pending listings matching “${target}”. Use the exact title to avoid changing the wrong one.` : `I couldn't find a pending listing matching “${target}”.` });

  const listing = matches[0];
  return NextResponse.json({
    text: `Please confirm: ${status} “${listing.title}” from ${listing.sellerName} at GH₵${listing.priceGhs.toLocaleString("en-GH")}.`,
    action: { type: "admin-community-status", listingId: listing.id, listingTitle: listing.title, status },
  });
}
