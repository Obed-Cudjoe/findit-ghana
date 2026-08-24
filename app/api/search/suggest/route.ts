// GET /api/search/suggest?q=… — autocomplete for the search bar.
import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const suggestions = searchSuggestions(q, 8);
  return NextResponse.json({ suggestions });
}
