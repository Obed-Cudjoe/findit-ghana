// GET /api/product/[slug] — JSON for one merged product page (product,
// merged offers across shops, vendors). Used by the compare builder.
// Same data the product page renders, so compare can never disagree.
import { NextResponse, type NextRequest } from "next/server";
import { getMergedProductPage } from "@/lib/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = await getMergedProductPage(slug);
  if (!page) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const { product, offers, vendors } = page;
  return NextResponse.json(
    { product, offers, vendors },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } },
  );
}
