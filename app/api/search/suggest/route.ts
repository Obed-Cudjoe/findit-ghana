// GET /api/search/suggest?q=… — autocomplete for the search bar.
// Serves catalogue suggestions PLUS approved independent vendor listings,
// so a vendor product appears in the dropdown the moment it goes live.
import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestionsAll } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const suggestions = await searchSuggestionsAll(q, 8);
  return NextResponse.json({ suggestions });
}
