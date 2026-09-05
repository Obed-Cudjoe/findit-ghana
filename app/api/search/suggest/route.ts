// GET /api/search/suggest?q=… — autocomplete for the search bar.
// Serves catalogue suggestions PLUS approved independent vendor listings,
// so a vendor product appears in the dropdown the moment it goes live.
import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestionsAll } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const suggestions = await searchSuggestionsAll(q, 8);
  // CDN-cache identical queries for 30s: autocomplete is hit on every
  // keystroke and its results change at marketplace-state pace, not per key.
  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
  );
}
