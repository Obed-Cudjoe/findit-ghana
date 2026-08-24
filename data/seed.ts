// Seed dataset — realistic demo content so the site is presentable immediately.
// In production this is replaced by the Supabase data pipeline (lib/store.ts).

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

export const products = [
  {
    id: "p1", name: "iPhone 13 (128GB)", slug: "iphone-13-128gb", category: "phones", brand: "Apple",
    specs: { Display: "6.1-inch Super Retina XDR", Storage: "128GB", Chip: "A15 Bionic", SIM: "Dual SIM" },
    gradient: "linear-gradient(135deg,#0F2A43 0%,#24507A 100%)", icon: "smartphone",
    canonicalUrl: "https://www.jumia.com.gh/iphone-13", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p2", name: "Tecno Spark 20", slug: "tecno-spark-20", category: "phones", brand: "Tecno",
    specs: { Display: "6.6-inch 90Hz", Storage: "128GB", RAM: "8GB", SIM: "Dual SIM" },
    gradient: "linear-gradient(135deg,#0E4A40 0%,#1B7C6B 100%)", icon: "smartphone",
    canonicalUrl: "https://www.jumia.com.gh/tecno-spark-20", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p3", name: "Samsung Galaxy A15", slug: "samsung-galaxy-a15", category: "phones", brand: "Samsung",
    specs: { Display: "6.5-inch Super AMOLED", Storage: "128GB", RAM: "6GB", SIM: "Dual SIM" },
    gradient: "linear-gradient(135deg,#0E2A4A 0%,#1B5A7C 100%)", icon: "smartphone",
    canonicalUrl: "https://www.jumia.com.gh/galaxy-a15", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p4", name: "HP Pavilion 15 Laptop", slug: "hp-pavilion-15", category: "laptops", brand: "HP",
    specs: { Display: '15.6-inch FHD', RAM: "16GB", Storage: "512GB SSD", OS: "Windows 11" },
    gradient: "linear-gradient(135deg,#141E30 0%,#243B55 100%)", icon: "laptop",
    canonicalUrl: "https://www.jumia.com.gh/hp-pavilion-15", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p5", name: "MacBook Air M2", slug: "macbook-air-m2", category: "laptops", brand: "Apple",
    specs: { Display: '13.6-inch Liquid Retina', RAM: "8GB", Storage: "256GB SSD", Chip: "Apple M2" },
    gradient: "linear-gradient(135deg,#2A0E4A 0%,#4A1B7C 100%)", icon: "laptop",
    canonicalUrl: "https://www.jumia.com.gh/macbook-air-m2", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p6", name: "Samsung 55-inch 4K TV", slug: "samsung-55-4k-tv", category: "tv-audio", brand: "Samsung",
    specs: { Display: '55-inch 4K UHD', Smart: "Tizen OS", Ports: "3x HDMI", Sound: "20W" },
    gradient: "linear-gradient(135deg,#0E2A1B 0%,#1B5A3A 100%)", icon: "tv",
    canonicalUrl: "https://www.jumia.com.gh/samsung-55-4k", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p7", name: "JBL Flip 6 Speaker", slug: "jbl-flip-6", category: "tv-audio", brand: "JBL",
    specs: { Battery: "12 hours", Waterproof: "IP67", Connectivity: "Bluetooth 5.1", Power: "30W" },
    gradient: "linear-gradient(135deg,#3A0E0E 0%,#7C1B1B 100%)", icon: "speaker",
    canonicalUrl: "https://www.jumia.com.gh/jbl-flip-6", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p8", name: "4-Burner Gas Cooker", slug: "4-burner-gas-cooker", category: "appliances", brand: "Nasco",
    specs: { Burners: "4", Ignition: "Auto", Material: "Stainless steel", Oven: "Yes" },
    gradient: "linear-gradient(135deg,#4A2A0E 0%,#7C4A1B 100%)", icon: "flame",
    canonicalUrl: "https://www.jumia.com.gh/gas-cooker-4-burner", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p9", name: "LG 320L Double-Door Fridge", slug: "lg-320l-fridge", category: "appliances", brand: "LG",
    specs: { Capacity: "320L", Energy: "Class A", Doors: "2", Colour: "Silver" },
    gradient: "linear-gradient(135deg,#1B2A3A 0%,#3A4A5A 100%)", icon: "refrigerator",
    canonicalUrl: "https://www.jumia.com.gh/lg-fridge-320", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p10", name: "Bruhm Washing Machine 7kg", slug: "bruhm-washer-7kg", category: "appliances", brand: "Bruhm",
    specs: { Capacity: "7kg", Spin: "1000 RPM", Programmes: "12", Energy: "Class A+" },
    gradient: "linear-gradient(135deg,#0E3A2A 0%,#1B7C5A 100%)", icon: "washing-machine",
    canonicalUrl: "https://www.jumia.com.gh/bruhm-washer-7kg", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p11", name: "Sony PS5 (Disc Edition)", slug: "sony-ps5-disc", category: "gaming", brand: "Sony",
    specs: { Storage: "825GB SSD", Resolution: "Up to 8K", Edition: "Disc", Controller: "DualSense" },
    gradient: "linear-gradient(135deg,#0F0F2A 0%,#1F1F5A 100%)", icon: "gamepad",
    canonicalUrl: "https://www.jumia.com.gh/ps5", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p12", name: "Xbox Series S", slug: "xbox-series-s", category: "gaming", brand: "Microsoft",
    specs: { Storage: "512GB SSD", Resolution: "1440p", Edition: "Digital", Storage2: "Expandable" },
    gradient: "linear-gradient(135deg,#0E3A0E 0%,#1B7C1B 100%)", icon: "gamepad",
    canonicalUrl: "https://www.jumia.com.gh/xbox-series-s", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p13", name: "Apple Watch SE (2nd Gen)", slug: "apple-watch-se-2", category: "fashion", brand: "Apple",
    specs: { Display: "Retina OLED", Case: "40mm", GPS: "Yes", Water: "50m" },
    gradient: "linear-gradient(135deg,#2A0E2A 0%,#5A1B5A 100%)", icon: "watch",
    canonicalUrl: "https://www.jumia.com.gh/apple-watch-se", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p14", name: "AirPods Pro (2nd Gen)", slug: "airpods-pro-2", category: "tv-audio", brand: "Apple",
    specs: { ANC: "Active noise cancellation", Battery: "30 hours with case", Water: "IPX4", Chip: "H2" },
    gradient: "linear-gradient(135deg,#1B1B2A 0%,#3A3A5A 100%)", icon: "headphones",
    canonicalUrl: "https://www.jumia.com.gh/airpods-pro-2", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p15", name: "Infinix Hot 40i", slug: "infinix-hot-40i", category: "phones", brand: "Infinix",
    specs: { Display: "6.56-inch 90Hz", Storage: "128GB", RAM: "8GB", Battery: "5000mAh" },
    gradient: "linear-gradient(135deg,#0E3A3A 0%,#1B7C7C 100%)", icon: "smartphone",
    canonicalUrl: "https://www.jumia.com.gh/infinix-hot-40i", updatedAt: "2026-08-24T09:14:00Z",
  },
  {
    id: "p16", name: "Itel P55", slug: "itel-p55", category: "phones", brand: "Itel",
    specs: { Display: "6.6-inch", Storage: "128GB", Battery: "5000mAh", SIM: "Dual SIM" },
    gradient: "linear-gradient(135deg,#3A1B0E 0%,#7C3A1B 100%)", icon: "smartphone",
    canonicalUrl: "https://www.jumia.com.gh/itel-p55", updatedAt: "2026-08-24T09:14:00Z",
  },
] as const;

// Offers: who sells it, at what price, stock, delivery and the outbound link.
export const offers = [
  // iPhone 13
  { id: "o1", productSlug: "iphone-13-128gb", vendorId: "v1", priceGhs: 6200, stockCount: 14, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 45, affiliateUrl: "https://www.jumia.com.gh/iphone-13", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o2", productSlug: "iphone-13-128gb", vendorId: "v2", priceGhs: 6450, stockCount: 3, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 2, deliveryFeeGhs: 60, affiliateUrl: "https://www.jumia.com.gh/iphone-13", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o3", productSlug: "iphone-13-128gb", vendorId: "v3", priceGhs: 7900, stockCount: null, deliveryZone: "Import (courier)", deliveryDaysMin: 10, deliveryDaysMax: 18, deliveryFeeGhs: 120, affiliateUrl: "https://www.jumia.com.gh/iphone-13", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Tecno Spark 20
  { id: "o4", productSlug: "tecno-spark-20", vendorId: "v1", priceGhs: 1150, stockCount: 42, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 40, affiliateUrl: "https://www.jumia.com.gh/tecno-spark-20", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o5", productSlug: "tecno-spark-20", vendorId: "v2", priceGhs: 1199, stockCount: 9, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 3, deliveryFeeGhs: 55, affiliateUrl: "https://www.jumia.com.gh/tecno-spark-20", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o6", productSlug: "tecno-spark-20", vendorId: "v5", priceGhs: 1120, stockCount: 18, deliveryZone: "Accra (Spintex)", deliveryDaysMin: 1, deliveryDaysMax: 3, deliveryFeeGhs: 50, affiliateUrl: "https://www.jumia.com.gh/tecno-spark-20", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Samsung A15
  { id: "o7", productSlug: "samsung-galaxy-a15", vendorId: "v1", priceGhs: 1550, stockCount: 21, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 40, affiliateUrl: "https://www.jumia.com.gh/galaxy-a15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o8", productSlug: "samsung-galaxy-a15", vendorId: "v2", priceGhs: 1600, stockCount: 5, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 3, deliveryFeeGhs: 55, affiliateUrl: "https://www.jumia.com.gh/galaxy-a15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o9", productSlug: "samsung-galaxy-a15", vendorId: "v3", priceGhs: 1750, stockCount: null, deliveryZone: "Import (courier)", deliveryDaysMin: 8, deliveryDaysMax: 14, deliveryFeeGhs: 100, affiliateUrl: "https://www.jumia.com.gh/galaxy-a15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // HP Pavilion
  { id: "o10", productSlug: "hp-pavilion-15", vendorId: "v1", priceGhs: 8900, stockCount: 5, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 3, deliveryFeeGhs: 80, affiliateUrl: "https://www.jumia.com.gh/hp-pavilion-15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o11", productSlug: "hp-pavilion-15", vendorId: "v2", priceGhs: 9050, stockCount: 1, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 4, deliveryFeeGhs: 95, affiliateUrl: "https://www.jumia.com.gh/hp-pavilion-15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o12", productSlug: "hp-pavilion-15", vendorId: "v6", priceGhs: 8700, stockCount: 2, deliveryZone: "Accra (Dansoman)", deliveryDaysMin: 2, deliveryDaysMax: 5, deliveryFeeGhs: 70, affiliateUrl: "https://www.jumia.com.gh/hp-pavilion-15", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // MacBook Air M2
  { id: "o13", productSlug: "macbook-air-m2", vendorId: "v1", priceGhs: 18400, stockCount: 3, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 60, affiliateUrl: "https://www.jumia.com.gh/macbook-air-m2", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o14", productSlug: "macbook-air-m2", vendorId: "v3", priceGhs: 19500, stockCount: null, deliveryZone: "Import (courier)", deliveryDaysMin: 9, deliveryDaysMax: 16, deliveryFeeGhs: 150, affiliateUrl: "https://www.jumia.com.gh/macbook-air-m2", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Samsung TV
  { id: "o15", productSlug: "samsung-55-4k-tv", vendorId: "v4", priceGhs: 7200, stockCount: 8, deliveryZone: "Accra", deliveryDaysMin: 2, deliveryDaysMax: 4, deliveryFeeGhs: 120, affiliateUrl: "https://www.jumia.com.gh/samsung-55-4k", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o16", productSlug: "samsung-55-4k-tv", vendorId: "v6", priceGhs: 6999, stockCount: 2, deliveryZone: "Accra (Dansoman)", deliveryDaysMin: 3, deliveryDaysMax: 5, deliveryFeeGhs: 100, affiliateUrl: "https://www.jumia.com.gh/samsung-55-4k", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // JBL Flip 6
  { id: "o17", productSlug: "jbl-flip-6", vendorId: "v5", priceGhs: 1450, stockCount: 12, deliveryZone: "Accra (Spintex)", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 40, affiliateUrl: "https://www.jumia.com.gh/jbl-flip-6", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o18", productSlug: "jbl-flip-6", vendorId: "v2", priceGhs: 1500, stockCount: 4, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 3, deliveryFeeGhs: 55, affiliateUrl: "https://www.jumia.com.gh/jbl-flip-6", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Gas cooker
  { id: "o19", productSlug: "4-burner-gas-cooker", vendorId: "v4", priceGhs: 950, stockCount: 11, deliveryZone: "Accra", deliveryDaysMin: 2, deliveryDaysMax: 4, deliveryFeeGhs: 80, affiliateUrl: "https://www.jumia.com.gh/gas-cooker-4-burner", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o20", productSlug: "4-burner-gas-cooker", vendorId: "v2", priceGhs: 990, stockCount: 4, deliveryZone: "Kumasi", deliveryDaysMin: 3, deliveryDaysMax: 5, deliveryFeeGhs: 90, affiliateUrl: "https://www.jumia.com.gh/gas-cooker-4-burner", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // LG fridge
  { id: "o21", productSlug: "lg-320l-fridge", vendorId: "v4", priceGhs: 4800, stockCount: 3, deliveryZone: "Accra", deliveryDaysMin: 2, deliveryDaysMax: 4, deliveryFeeGhs: 150, affiliateUrl: "https://www.jumia.com.gh/lg-fridge-320", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o22", productSlug: "lg-320l-fridge", vendorId: "v2", priceGhs: 4950, stockCount: 2, deliveryZone: "Kumasi", deliveryDaysMin: 3, deliveryDaysMax: 5, deliveryFeeGhs: 160, affiliateUrl: "https://www.jumia.com.gh/lg-fridge-320", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Bruhm washer
  { id: "o23", productSlug: "bruhm-washer-7kg", vendorId: "v4", priceGhs: 2350, stockCount: 6, deliveryZone: "Accra", deliveryDaysMin: 2, deliveryDaysMax: 5, deliveryFeeGhs: 130, affiliateUrl: "https://www.jumia.com.gh/bruhm-washer-7kg", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o24", productSlug: "bruhm-washer-7kg", vendorId: "v6", priceGhs: 2299, stockCount: 1, deliveryZone: "Accra (Dansoman)", deliveryDaysMin: 3, deliveryDaysMax: 6, deliveryFeeGhs: 110, affiliateUrl: "https://www.jumia.com.gh/bruhm-washer-7kg", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // PS5
  { id: "o25", productSlug: "sony-ps5-disc", vendorId: "v1", priceGhs: 9200, stockCount: 2, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 60, affiliateUrl: "https://www.jumia.com.gh/ps5", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o26", productSlug: "sony-ps5-disc", vendorId: "v3", priceGhs: 10500, stockCount: null, deliveryZone: "Import (courier)", deliveryDaysMin: 12, deliveryDaysMax: 20, deliveryFeeGhs: 200, affiliateUrl: "https://www.jumia.com.gh/ps5", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Xbox
  { id: "o27", productSlug: "xbox-series-s", vendorId: "v5", priceGhs: 5100, stockCount: 4, deliveryZone: "Accra (Spintex)", deliveryDaysMin: 1, deliveryDaysMax: 3, deliveryFeeGhs: 60, affiliateUrl: "https://www.jumia.com.gh/xbox-series-s", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o28", productSlug: "xbox-series-s", vendorId: "v2", priceGhs: 5250, stockCount: 2, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 4, deliveryFeeGhs: 70, affiliateUrl: "https://www.jumia.com.gh/xbox-series-s", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Apple Watch
  { id: "o29", productSlug: "apple-watch-se-2", vendorId: "v1", priceGhs: 4300, stockCount: 7, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 45, affiliateUrl: "https://www.jumia.com.gh/apple-watch-se", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o30", productSlug: "apple-watch-se-2", vendorId: "v3", priceGhs: 4700, stockCount: null, deliveryZone: "Import (courier)", deliveryDaysMin: 9, deliveryDaysMax: 15, deliveryFeeGhs: 110, affiliateUrl: "https://www.jumia.com.gh/apple-watch-se", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // AirPods Pro 2
  { id: "o31", productSlug: "airpods-pro-2", vendorId: "v1", priceGhs: 2700, stockCount: 8, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 40, affiliateUrl: "https://www.jumia.com.gh/airpods-pro-2", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o32", productSlug: "airpods-pro-2", vendorId: "v2", priceGhs: 2800, stockCount: 2, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 3, deliveryFeeGhs: 55, affiliateUrl: "https://www.jumia.com.gh/airpods-pro-2", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Infinix Hot 40i
  { id: "o33", productSlug: "infinix-hot-40i", vendorId: "v5", priceGhs: 1080, stockCount: 26, deliveryZone: "Accra (Spintex)", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 45, affiliateUrl: "https://www.jumia.com.gh/infinix-hot-40i", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o34", productSlug: "infinix-hot-40i", vendorId: "v2", priceGhs: 1120, stockCount: 7, deliveryZone: "Kumasi", deliveryDaysMin: 2, deliveryDaysMax: 3, deliveryFeeGhs: 55, affiliateUrl: "https://www.jumia.com.gh/infinix-hot-40i", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  // Itel P55
  { id: "o35", productSlug: "itel-p55", vendorId: "v1", priceGhs: 780, stockCount: 33, deliveryZone: "Accra", deliveryDaysMin: 1, deliveryDaysMax: 2, deliveryFeeGhs: 40, affiliateUrl: "https://www.jumia.com.gh/itel-p55", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
  { id: "o36", productSlug: "itel-p55", vendorId: "v5", priceGhs: 799, stockCount: 15, deliveryZone: "Accra (Spintex)", deliveryDaysMin: 1, deliveryDaysMax: 3, deliveryFeeGhs: 45, affiliateUrl: "https://www.jumia.com.gh/itel-p55", lastCheckedAt: "2026-08-24T09:14:00Z", active: true },
] as const;

// Price history snapshots — powers the 12-week sparkline on product pages.
export const snapshots = [
  { offerId: "o1", priceGhs: 6350, capturedAt: "2026-06-01T00:00:00Z" },
  { offerId: "o1", priceGhs: 6290, capturedAt: "2026-06-29T00:00:00Z" },
  { offerId: "o1", priceGhs: 6250, capturedAt: "2026-07-27T00:00:00Z" },
  { offerId: "o1", priceGhs: 6200, capturedAt: "2026-08-24T00:00:00Z" },
  { offerId: "o2", priceGhs: 6600, capturedAt: "2026-06-01T00:00:00Z" },
  { offerId: "o2", priceGhs: 6520, capturedAt: "2026-06-29T00:00:00Z" },
  { offerId: "o2", priceGhs: 6480, capturedAt: "2026-07-27T00:00:00Z" },
  { offerId: "o2", priceGhs: 6450, capturedAt: "2026-08-24T00:00:00Z" },
  { offerId: "o4", priceGhs: 1200, capturedAt: "2026-06-01T00:00:00Z" },
  { offerId: "o4", priceGhs: 1175, capturedAt: "2026-07-27T00:00:00Z" },
  { offerId: "o4", priceGhs: 1150, capturedAt: "2026-08-24T00:00:00Z" },
  { offerId: "o7", priceGhs: 1650, capturedAt: "2026-06-01T00:00:00Z" },
  { offerId: "o7", priceGhs: 1590, capturedAt: "2026-07-27T00:00:00Z" },
  { offerId: "o7", priceGhs: 1550, capturedAt: "2026-08-24T00:00:00Z" },
  { offerId: "o25", priceGhs: 9800, capturedAt: "2026-06-01T00:00:00Z" },
  { offerId: "o25", priceGhs: 9400, capturedAt: "2026-07-27T00:00:00Z" },
  { offerId: "o25", priceGhs: 9200, capturedAt: "2026-08-24T00:00:00Z" },
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
      "At this budget you can expect 128GB storage, dual SIM and a 90Hz display — as long as you know where to look. The table below compares every vendor's price in cedis, not dollars.",
      "## The three we'd actually buy",
      "Tecno Spark 20 — the all-rounder. 8GB RAM, a 90Hz screen and the widest stock availability in Accra.",
      "Infinix Hot 40i — the battery champion. 5000mAh means two full days between charges.",
      "Itel P55 — the budget pick. Under GH₵800 and still delivers dual SIM and 128GB.",
      "## Where the prices come from",
      "Every price on this page comes from a named vendor's live listing, re-checked daily. If a price is wrong, the last-checked timestamp next to it is your proof to challenge it — and our report form is one tap away.",
    ].join("\n"),
    updatedAt: "2026-08-24",
    readMinutes: 6,
    relatedProductSlugs: ["tecno-spark-20", "infinix-hot-40i", "itel-p55"],
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
    relatedProductSlugs: ["iphone-13-128gb", "samsung-galaxy-a15"],
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
    relatedProductSlugs: ["4-burner-gas-cooker", "lg-320l-fridge"],
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
    relatedProductSlugs: ["macbook-air-m2", "sony-ps5-disc"],
    gradient: "linear-gradient(135deg,#4A2A0E 0%,#7C4A12 100%)",
  },
] as const;
