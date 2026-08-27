import { NextResponse } from "next/server";
import { VENDOR_COOKIE } from "@/lib/vendor-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VENDOR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
