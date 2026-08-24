import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.ADMIN_PASSWORD || "findit-admin-2026");

export async function POST(request: NextRequest) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password || password !== (process.env.ADMIN_PASSWORD || "findit-admin-2026")) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("findit_admin", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
