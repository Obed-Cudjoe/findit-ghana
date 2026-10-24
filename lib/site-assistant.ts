import { searchAll, getVendor } from "@/lib/data";
import { readCommunityMarketListings } from "@/lib/community-market";
import { COMMUNITY_MARKET_CATEGORIES } from "@/lib/community-market-categories";
import { VENDOR_PLANS, WEEKLY_FEATURED_PRICE_GHS } from "@/lib/plans";
import { formatGHS } from "@/lib/utils";
import { readVendorListings, listingsForVendor } from "@/lib/store";
import type { VendorProfile } from "@/lib/types";
import type { SiteAssistantAction, SiteAssistantLink, SiteAssistantReply } from "@/lib/site-assistant-shared";

export type AssistantLink = SiteAssistantLink;
export type AssistantReply = SiteAssistantReply;

const shortcuts: AssistantLink[] = [
  { label: "Search products", href: "/search" },
  { label: "Compare products", href: "/compare" },
  { label: "Community Market", href: "/community-market" },
  { label: "Seller plans", href: "/for-vendors" },
];

function cleanProductQuery(input: string): { query: string; budget: number | null } {
  const lower = input.toLowerCase();
  const match = lower.match(/(?:under|below|less than|up to|max(?:imum)?|within)\s*(?:gh₵|ghs?\s*)?([\d,]+)/i);
  const budget = match ? Number(match[1].replace(/,/g, "")) : null;
  const query = lower
    .replace(/(?:under|below|less than|up to|max(?:imum)?|within)\s*(?:gh₵|ghs?\s*)?[\d,]+/gi, " ")
    .replace(/\b(?:please|can you|could you|find|show|search|compare|price|prices|cost|how much|what is|what's|what|are|is|the|of|for me|i|me|want|looking|buy|in ghana|in ghana cedis|ghana cedis|cedis|gh₵|ghs)\b/gi, " ")
    .replace(/[?.,!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { query, budget: Number.isFinite(budget) ? budget : null };
}

function vendorPlanReply(): AssistantReply {
  return {
    text: `Vendor plans: Free has ${VENDOR_PLANS.free.listingLimit} listings; Starter is ${formatGHS(VENDOR_PLANS.starter.priceGhs)}/month for ${VENDOR_PLANS.starter.listingLimit}; Pro is ${formatGHS(VENDOR_PLANS.pro.priceGhs)}/month for ${VENDOR_PLANS.pro.listingLimit}; Growth is ${formatGHS(VENDOR_PLANS.unlimited.priceGhs)}/month for ${VENDOR_PLANS.unlimited.listingLimit}. Paid plans are currently confirmed manually by MoMo. A weekly featured boost is ${formatGHS(WEEKLY_FEATURED_PRICE_GHS)}.`,
    links: [{ label: "Register or manage a shop", href: "/for-vendors" }],
  };
}

async function vendorTaskReply(input: string, vendor: VendorProfile | null): Promise<AssistantReply | null> {
  const q = input.toLowerCase();
  const wantsOwnListings = /\b(my listings|my products|my shop|how many listings|listing status)\b/.test(q);
  const wantsPriceChange = /\b(change|update|set)\b/.test(q) && /\bprice\b/.test(q);
  if (!wantsOwnListings && !wantsPriceChange) return null;
  if (!vendor) {
    return { text: "Sign in to your vendor account first. I can only look up or change listings belonging to the signed-in shop.", links: [{ label: "Vendor login", href: "/vendor/login" }] };
  }

  const mine = listingsForVendor(await readVendorListings(), vendor);
  if (wantsOwnListings && !wantsPriceChange) {
    const active = mine.filter((item) => item.status !== "rejected");
    if (!active.length) return { text: "I couldn't find any active listings linked to your shop yet.", links: [{ label: "Manage listings", href: "/vendor/listings" }] };
    const summary = active.slice(0, 6).map((item) => `• ${item.productName} — ${formatGHS(item.priceGhs)} (${item.status})`).join("\n");
    return { text: `Your shop has ${active.length} active or pending listing${active.length === 1 ? "" : "s"}:\n${summary}`, links: [{ label: "Open your listings", href: "/vendor/listings" }] };
  }

  const priceMatch = q.match(/\b(?:to|at)\s*(?:gh₵|ghs?\s*)?([\d,]+(?:\.\d{1,2})?)\s*$/i);
  const newPrice = priceMatch ? Number(priceMatch[1].replace(/,/g, "")) : NaN;
  const itemQuery = q.slice(0, priceMatch?.index ?? q.length)
    .replace(/\b(?:change|update|set|the|my|price|for|on|listing|item|product|of|to|at|gh₵|ghs)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  if (!Number.isFinite(newPrice) || newPrice <= 0 || !itemQuery) {
    return { text: "To prepare a price change, say something like ‘change my Tecno Spark 50 price to GH₵1,900’. I’ll show the proposed change and ask you to confirm before saving.", links: [{ label: "Manage listings", href: "/vendor/listings" }] };
  }
  const tokens = itemQuery.split(" ").filter((token) => token.length > 1);
  const matches = mine.filter((item) => {
    const name = item.productName.toLowerCase();
    return name.includes(itemQuery) || tokens.every((token) => name.includes(token));
  });
  if (matches.length !== 1) {
    return { text: matches.length ? `I found ${matches.length} possible listings. Open your listings and use Edit so I don't change the wrong item.` : `I couldn't find one of your listings matching “${itemQuery}”.`, links: [{ label: "Open your listings", href: "/vendor/listings" }] };
  }
  const listing = matches[0];
  return {
    text: "Please review this proposed change. I will not save it until you confirm.",
    action: { type: "vendor-price-change", listingId: listing.id, listingTitle: listing.productName, oldPriceGhs: listing.priceGhs, newPriceGhs: Math.round(newPrice) },
    links: [{ label: "Open your listings", href: "/vendor/listings" }],
  };
}
async function communityReply(input: string): Promise<AssistantReply> {
  const all = await readCommunityMarketListings();
  const q = input.toLowerCase().replace(/\b(community|market|marketplace|find|show|search|listings|listing|items|item|for sale|please|can you|could you)\b/g, " ").replace(/\s+/g, " ").trim();
  const matches = all.filter((item) => {
    if (!q) return true;
    const hay = `${item.title} ${item.description} ${item.location} ${item.sellerName} ${COMMUNITY_MARKET_CATEGORIES.find((c) => c.slug === item.category)?.label ?? ""}`.toLowerCase();
    return q.split(" ").filter(Boolean).every((token) => hay.includes(token));
  }).slice(0, 4);
  if (!matches.length) {
    return {
      text: all.length ? "I couldn't find an approved Community Market listing matching that. Try a shorter search, or open the market to browse categories." : "There are no approved Community Market listings showing yet. Community submissions need an admin review before they appear.",
      links: [{ label: "Browse Community Market", href: "/community-market" }, { label: "Post a listing", href: "/community-market/new" }],
    };
  }
  const lines = matches.map((item) => `• ${item.title} — ${item.priceGhs === 0 ? "Free" : formatGHS(item.priceGhs)}${item.location ? ` · ${item.location}` : ""} · seller: ${item.sellerName}`);
  return {
    text: `Here are approved community listings I found:\n${lines.join("\n")}\nListings are seller-submitted and not independently verified. Contact the seller directly and check the item before paying.`,
    links: [{ label: "Open Community Market", href: "/community-market" }],
  };
}

export async function answerFindItQuestion(input: string, vendor: VendorProfile | null = null): Promise<AssistantReply> {
  const original = input.trim().slice(0, 300);
  const q = original.toLowerCase();
  if (!q) return { text: "Ask me to find a product price, browse Community Market listings, compare items, or explain seller plans.", links: shortcuts };

  if (/what is findit|what does (this )?site do|what can you help/.test(q)) {
    return { text: "FindIt Ghana compares prices from listed shops and also has a separate Community Market for user-submitted classifieds. I can search product prices, help browse approved community listings, explain seller plans, or direct you to the relevant page.", links: shortcuts };
  }
  if (/seller plan|vendor plan|pricing|subscription|plan price|how much.*(sell|vendor|shop)|become a vendor|register.*shop/.test(q)) return vendorPlanReply();
  const vendorTask = await vendorTaskReply(original, vendor);
  if (vendorTask) return vendorTask;
  if (/\b(?:post|submit|list|sell)\b.*\b(?:community|market)\b|\b(?:community|market)\b.*\b(?:post|submit|list|sell)\b/.test(q)) {
    return { text: "You can submit an item or service to the Community Market for free. I can open a guided listing form here; the item will still stay pending until admin review.", action: { type: "open-community-listing-form" }, links: [{ label: "Post a Community Market listing", href: "/community-market/new" }] };
  }
  if (/community market|community listing|used item|second.hand|member listing|items? for sale|market listing/.test(q)) return communityReply(original);
  if (/compare|versus|\bvs\b/.test(q)) {
    return { text: "You can compare up to three catalogue products side by side. Search for a product first, then add it to Compare. Community Market listings are separate and aren’t included in product-price comparisons.", links: [{ label: "Open Compare", href: "/compare" }, { label: "Search products", href: "/search" }] };
  }
  if (/how.*(list|post)|post.*(item|product)|sell.*(item|product)|list.*(item|product)/.test(q)) {
    return { text: "For shop products, register on For vendors and choose a plan. For a one-off community item or service, submit it to Community Market; an admin reviews it before it becomes public.", links: [{ label: "For vendors", href: "/for-vendors" }, { label: "Post in Community Market", href: "/community-market/new" }] };
  }
  if (/verified|safe|scam|trust/.test(q)) {
    return { text: "FindIt’s curated catalogue compares listed shop offers. Community Market listings are user-submitted and reviewed before publication, but sellers and items are not independently verified. Confirm details directly and inspect items before paying.", links: [{ label: "Trust & safety", href: "/trust" }, { label: "Community Market", href: "/community-market" }] };
  }

  const { query, budget } = cleanProductQuery(original);
  if (!query) return { text: "Tell me a product name or model—for example, ‘Samsung A15 under GH₵3,000’. I’ll search FindIt’s catalogue data.", links: shortcuts };

  try {
    const results = await searchAll(query);
    const ranked = results
      .map((result) => {
        const offers = result.offers.filter((offer) => offer.active).sort((a, b) => (a.priceGhs + a.deliveryFeeGhs) - (b.priceGhs + b.deliveryFeeGhs));
        return { ...result, offers };
      })
      .filter((result) => result.offers.length > 0 && (budget === null || result.offers[0].priceGhs + result.offers[0].deliveryFeeGhs <= budget))
      .slice(0, 3);

    if (!ranked.length) {
      const suffix = budget === null ? "" : ` under ${formatGHS(budget)}`;
      return { text: `I couldn't find a catalogue match for “${query}”${suffix}. Try a shorter model name or browse search.`, links: [{ label: "Search all products", href: `/search?q=${encodeURIComponent(query)}` }, { label: "Browse categories", href: "/category/phones" }] };
    }

    const text = ranked.map((result) => {
      const top = result.offers[0];
      const vendor = getVendor(top.vendorId)?.name ?? "a listed seller";
      const total = top.priceGhs + top.deliveryFeeGhs;
      return `• ${result.product.name}: from ${formatGHS(total)} total at ${vendor}${top.deliveryFeeGhs > 0 ? ` (includes ${formatGHS(top.deliveryFeeGhs)} delivery)` : ""}`;
    }).join("\n");
    return {
      text: `From the catalogue data I found:\n${text}\nCheck the product page for the other offers and confirm stock and final delivery details with the seller.`,
      links: ranked.map((result) => ({ label: result.product.name, href: `/product/${result.product.slug}` })),
    };
  } catch {
    return { text: "I couldn't load the catalogue just now. Try the search page or come back in a moment.", links: [{ label: "Search products", href: "/search" }] };
  }
}
