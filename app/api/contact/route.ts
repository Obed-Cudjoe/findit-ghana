// POST /api/contact — contact form (P12). Validates and stores.
import { NextResponse, type NextRequest } from "next/server";
import { saveContact } from "@/lib/store";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "General question";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "Write a short message (at least 10 characters)." }, { status: 400 });

  const ok = await saveContact({ name, email, topic, message });
  if (!ok) return NextResponse.json({ error: "Could not store the message. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
