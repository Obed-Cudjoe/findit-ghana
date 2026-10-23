export const COMMUNITY_MARKET_CATEGORIES = [
  { slug: "electronics", label: "Phones & electronics" },
  { slug: "clothing", label: "Clothing & accessories" },
  { slug: "books-study", label: "Books & study" },
  { slug: "home", label: "Home & furniture" },
  { slug: "food-services", label: "Food & services" },
  { slug: "other", label: "Other" },
] as const;

export type CommunityMarketCategory = (typeof COMMUNITY_MARKET_CATEGORIES)[number]["slug"];
export type CommunityListingStatus = "pending" | "approved" | "rejected" | "sold";
