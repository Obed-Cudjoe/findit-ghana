// POST /api/click — affiliate outbound-click tracking (fire-and-forget from the Buy buttons).
import { NextResponse, type NextRequest } from "next/server";
import { saveClick } from "@/lib/store";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const productSlug = typeof body.productSlug === "string" ? body.productSlug : "";
  const vendorName = typeof body.vendorName === "string" ? body.vendorName : "";
  const destinationUrl = typeof body.destinationUrl === "string" ? body.destinationUrl : "";
  if (!destinationUrl) return NextResponse.json({ error: "Missing destination." }, { status: 400 });

  await saveClick({ productSlug, vendorName, destinationUrl });
  return NextResponse.json({ ok: true });
}
