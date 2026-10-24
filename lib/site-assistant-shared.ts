export type SiteAssistantAction =
  | { type: "open-community-listing-form" }
  | { type: "vendor-price-change"; listingId: string; listingTitle: string; oldPriceGhs: number; newPriceGhs: number }
  | { type: "admin-community-status"; listingId: string; listingTitle: string; status: "approved" | "rejected" };

export interface SiteAssistantLink {
  label: string;
  href: string;
}

export interface SiteAssistantReply {
  text: string;
  links?: SiteAssistantLink[];
  action?: SiteAssistantAction;
}
