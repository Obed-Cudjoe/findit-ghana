import { NextResponse, type NextRequest } from "next/server";
import { answerFindItQuestion } from "@/lib/site-assistant";
import { getLoggedInVendor } from "@/lib/vendor-auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const limit = rateLimit(`site-assistant:${clientIp(request)}`, 20, 5 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: "Please wait a moment before asking another question." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });
  }
  let body: { message?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Send a short question in text." }, { status: 400 }); }
  if (typeof body.message !== "string" || body.message.trim().length === 0) return NextResponse.json({ error: "Type a question first." }, { status: 400 });
  if (body.message.length > 300) return NextResponse.json({ error: "Please keep your question under 300 characters." }, { status: 400 });
  const vendor = await getLoggedInVendor();
  const reply = await answerFindItQuestion(body.message, vendor);
  return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
}
