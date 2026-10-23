import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CommunityListingStatus, CommunityMarketCategory } from "@/lib/community-market-categories";

export interface CommunityMarketListing {
  id: string;
  slug: string;
  title: string;
  category: CommunityMarketCategory;
  description: string;
  priceGhs: number;
  condition: string;
  location: string;
  sellerName: string;
  sellerWhatsapp: string;
  imageUrls: string[];
  status: CommunityListingStatus;
  createdAt: string;
  expiresAt: string;
}

let client: SupabaseClient | null = null;
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

function mapListing(row: Record<string, unknown>): CommunityMarketListing {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    category: String(row.category) as CommunityMarketCategory,
    description: String(row.description ?? ""),
    priceGhs: Number(row.price_ghs),
    condition: String(row.condition ?? "unspecified"),
    location: String(row.location ?? ""),
    sellerName: String(row.seller_name),
    sellerWhatsapp: String(row.seller_whatsapp),
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls.filter((u): u is string => typeof u === "string") : [],
    status: String(row.status) as CommunityListingStatus,
    createdAt: String(row.created_at),
    expiresAt: String(row.expires_at),
  };
}

export async function readCommunityMarketListings(options: { includeHidden?: boolean } = {}): Promise<CommunityMarketListing[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase.from("community_market_listings").select("*").order("created_at", { ascending: false });
  if (!options.includeHidden) {
    query = query.eq("status", "approved").gt("expires_at", new Date().toISOString());
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapListing);
}

export async function createCommunityMarketListing(input: {
  slug: string;
  title: string;
  category: CommunityMarketCategory;
  description: string;
  priceGhs: number;
  condition: string;
  location: string;
  sellerName: string;
  sellerWhatsapp: string;
  imageUrls: string[];
}): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("community_market_listings").insert({
    slug: input.slug,
    title: input.title,
    category: input.category,
    description: input.description,
    price_ghs: input.priceGhs,
    condition: input.condition,
    location: input.location,
    seller_name: input.sellerName,
    seller_whatsapp: input.sellerWhatsapp,
    image_urls: input.imageUrls,
    status: "pending",
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  return !error;
}

export async function setCommunityMarketListingStatus(id: string, status: CommunityListingStatus): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from("community_market_listings").update({ status }).eq("id", id);
  return !error;
}
