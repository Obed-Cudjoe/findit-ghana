// Site scaffolding dataset: vendors, categories and guides.
// The PRODUCT CATALOGUE is real — it comes from the Jumia Ghana marketplace
// snapshot loaded by lib/feeds/jumia.ts (data/jumia-catalog.json), which
// replaced the old 16-item demo products/offers/snapshots.

export const vendors = [
  { id: "v1", name: "DeviceDeal GH", slug: "devicedeal-gh", verified: true, source: "direct", logoHue: 210 },
  { id: "v2", name: "MobileMall", slug: "mobilemall", verified: true, source: "direct", logoHue: 160 },
  { id: "v3", name: "ImportCourier GH", slug: "importcourier-gh", verified: false, source: "import", logoHue: 25 },
  { id: "v4", name: "Nasco Electronics", slug: "nasco-electronics", verified: true, source: "direct", logoHue: 190 },
  { id: "v5", name: "Telefonika GH", slug: "telefonika-gh", verified: true, source: "direct", logoHue: 265 },
  { id: "v6", name: "GadgetWorks", slug: "gadgetworks", verified: false, source: "direct", logoHue: 330 },
] as const;

export const categories = [
  { slug: "phones", name: "Phones", icon: "smartphone", blurb: "Smartphones and feature phones, priced in cedis from named vendors across Ghana.", gradient: "linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)" },
  { slug: "laptops", name: "Laptops", icon: "laptop", blurb: "New and business laptops with stock levels and delivery costs shown upfront.", gradient: "linear-gradient(135deg,#0E4A40 0%,#127C6B 100%)" },
  { slug: "tv-audio", name: "TVs & Audio", icon: "tv", blurb: "Televisions, soundbars and audio — compare vendors before you pay.", gradient: "linear-gradient(135deg,#4A2A0E 0%,#7C4A12 100%)" },
  { slug: "appliances", name: "Appliances", icon: "refrigerator", blurb: "Fridges, cookers and home appliances with delivery fees visible up front.", gradient: "linear-gradient(135deg,#3A0E4A 0%,#6B1B7C 100%)" },
  { slug: "gaming", name: "Gaming", icon: "gamepad", blurb: "Consoles and accessories — local stock vs import options side by side.", gradient: "linear-gradient(135deg,#1B0E4A 0%,#3A1B7C 100%)" },
  { slug: "fashion", name: "Fashion", icon: "shirt", blurb: "Wearables and fashion tech from Ghanaian social-commerce vendors.", gradient: "linear-gradient(135deg,#4A0E2A 0%,#7C1B4A 100%)" },
] as const;

export const guides = [
  {
    slug: "best-phones-under-2000-cedis",
    title: "Best phones under GH₵2,000 (updated weekly)",
    excerpt: "Our weekly round-up of the phones actually worth your money — with live prices from named vendors.",
    seoTitle: "Best Phones Under GH₵2,000 in Ghana (2026) — Live Prices",
    metaDescription: "The best phones under GH₵2,000 in Ghana, compared side by side with live prices, stock and delivery costs from named vendors.",
    body: [
      "## What you get for the money",
      "At this budget you can expect 128GB storage, dual SIM and a smooth 90Hz-and-up display — as long as you know where to look. The table below compares every live price in cedis, not dollars.",
      "## The four we'd actually buy",
      "Infinix Smart 20 (64GB) — the value pick at about GH₵1,352. Same 4GB RAM as phones twice its price.",
      "Infinix Smart 20 (120Hz, 6.78\") — the smooth-screen pick at about GH₵1,420.",
      "TECNO Pop 20 (64GB) — the budget all-rounder at about GH₵1,499, with a big 6.75-inch screen and 5000mAh battery.",
      "TECNO Pop 20 (128GB) — double the storage for about GH₵1,645, still under budget.",
      "## Where the prices come from",
      "Every price on this page comes from a live marketplace listing (Jumia Ghana), re-checked against the latest catalogue snapshot. If a price looks wrong, the last-checked timestamp next to it is your proof to challenge it — and our report form is one tap away.",
    ].join("\n"),
    updatedAt: "2026-08-25",
    readMinutes: 6,
    relatedProductSlugs: [
      "infinix-smart-20-6.67-64gb-4gb-ram-shadow-black-300795278",
      "infinix-smart-20-120hz-smooth-display-6.78-punch-hole-screen-64gb-hdd-4gb-ram--300709679",
      "tecno-pop-20-6.75-display-64gb-hdd-4gb-ram-13mp-8mp-5000mah-black-300666376",
      "tecno-pop-20-6.75-display-128gb-hdd-4gb-ram-13mp-8mp-5000mah-black-300666373",
    ],
    gradient: "linear-gradient(135deg,#0F2A43 0%,#1B4B6E 100%)",
  },
  {
    slug: "spot-a-fake-vendor",
    title: "How to spot a fake vendor before you pay",
    excerpt: "The four warning signs our checks team looks for — and the questions to ask before any payment.",
    seoTitle: "How to Spot a Fake Vendor in Ghana — 4 Warning Signs",
    metaDescription: "Prepay scams cost Ghanaian shoppers millions every year. Learn the four warning signs of a fake vendor before you send any money.",
    body: [
      "## Too cheap to be true",
      "If the price is far below every other vendor's, that is the first red flag. A brand-new iPhone is never half price — but the scammer's story is always the same: urgent sale, limited stock.",
      "## The four questions to ask every vendor",
      "1. Is the vendor named? Anonymous pages hide because they plan to disappear.",
      "2. Is the price in cedis, with delivery shown upfront? Surprise fees are a classic trap.",
      "3. Do they accept payment on delivery — or at least escrow? Prepay-only is a warning sign.",
      "4. What do other buyers say? Check for reviews outside their own page.",
      "## What we do about it",
      "FindIt Ghana only lists named vendors with a published track record, and every report of a suspicious listing goes straight to our checks team.",
    ].join("\n"),
    updatedAt: "2026-08-18",
    readMinutes: 4,
    relatedProductSlugs: [
      "tecno-camon-50-ultra-nano-sim-6.78-512gb-rom-8gb-ram-50mp-rear50mp-front-5200m-300824680",
      "infinix-hot-70-128gb-4gb-silver-dancer-300827177",
    ],
    gradient: "linear-gradient(135deg,#4A0E0E 0%,#7C1B1B 100%)",
  },
  {
    slug: "delivery-costs-accra",
    title: "What delivery should really cost in Accra",
    excerpt: "Inside Accra, delivery fees should rarely surprise you. Here's what vendors charge and why.",
    seoTitle: "Delivery Costs in Accra (2026) — What's Fair, What's Not",
    metaDescription: "What should delivery cost inside Accra? A practical guide to fair delivery fees per category, and the red flags of hidden charges.",
    body: [
      "## The honest numbers",
      "Inside Accra, most phone and gadget deliveries cost GH₵40–60 and arrive in 1–2 days. Large appliances (fridges, cookers) cost GH₵80–160 because they need two people and a truck.",
      "## When the fee is a warning sign",
      "A 'free delivery' offer on a suspiciously cheap item usually hides the cost somewhere else. Or worse — the 'courier' calls later asking for extra transport money before releasing your package.",
      "## How to protect yourself",
      "Always confirm the total cost before paying: item + delivery + any fee. On FindIt Ghana, every listing shows the delivery fee next to the price, so the total is visible before you click.",
    ].join("\n"),
    updatedAt: "2026-08-12",
    readMinutes: 5,
    relatedProductSlugs: [
      "roch-rfr-140t-b-117liters-double-door-refrigerator-silver-286294858",
      "nas-07-tw-7kg-semi-automatic-twin-tub-washing-machine-white-nasco-mpg7627580",
    ],
    gradient: "linear-gradient(135deg,#0E4A40 0%,#127C6B 100%)",
  },
  {
    slug: "import-vs-local-buying",
    title: "Import or buy local? The price truth",
    excerpt: "When the imported version is cheaper on paper and more expensive by the time it arrives.",
    seoTitle: "Import vs Local: The Real Cost of Shipping to Ghana",
    metaDescription: "Importing can cost more than 5x the item price after duty and handling. Compare the real landed cost against local stock.",
    body: [
      "## The port problem",
      "Ghanaian shoppers regularly report paying several times an item's price to clear it from the port — duty, handling, storage and 'unexpected' charges stack fast.",
      "## What the comparison table shows",
      "On product pages we show the import option next to local vendors, with the real delivery window (10–18 days) and fees visible. Sometimes import wins — usually for rare items. Usually, local stock wins on total cost and speed.",
      "## The rule of thumb",
      "If the local price is within 15% of the imported price after fees, buy local. You get it in days, not weeks, and you have a named vendor to return to if something's wrong.",
    ].join("\n"),
    updatedAt: "2026-08-05",
    readMinutes: 5,
    relatedProductSlugs: [
      "hp-840-g6-i5-8th-8gb-256ssd-touch-screen-silver-300639128",
      "microsoft-xbox-wireless-controller-robot-white-291049645",
    ],
    gradient: "linear-gradient(135deg,#4A2A0E 0%,#7C4A12 100%)",
  },
] as const;
