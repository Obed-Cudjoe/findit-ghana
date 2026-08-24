-- ============================================================
-- FindIt Ghana · seed.sql — demo data so the site works on day one
-- Run after 001_init.sql. Replace with the Jumia affiliate feed
-- once the affiliate account is approved (lib/feeds/jumia.ts).
-- ============================================================

insert into public.vendors (name, slug, verified, source, external_id) values
  ('DeviceDeal GH',   'devicedeal-gh',   true,  'direct', 'dd-01'),
  ('MobileMall',      'mobilemall',      true,  'direct', 'mm-01'),
  ('ImportCourier GH','importcourier-gh',false, 'import', 'ic-01')
on conflict (slug) do nothing;

insert into public.products (name, slug, category, brand, image_url, specs, canonical_affiliate_url, source) values
  ('iPhone 13 (128GB)',        'iphone-13-128gb',       'Phones',    'Apple',   'https://gh.jumia.com/placeholder/iphone13.jpg', '{"display":"6.1 inch","storage":"128GB","sim":"Dual SIM"}', 'https://www.jumia.com.gh/iphone-13', 'seed'),
  ('Tecno Spark 20',           'tecno-spark-20',        'Phones',    'Tecno',   'https://gh.jumia.com/placeholder/spark20.jpg',   '{"display":"6.6 inch","storage":"128GB","sim":"Dual SIM"}', 'https://www.jumia.com.gh/tecno-spark-20', 'seed'),
  ('Samsung Galaxy A15',       'samsung-galaxy-a15',    'Phones',    'Samsung', 'https://gh.jumia.com/placeholder/a15.jpg',       '{"display":"6.5 inch","storage":"128GB","sim":"Dual SIM"}', 'https://www.jumia.com.gh/galaxy-a15', 'seed'),
  ('4-Burner Gas Cooker',      '4-burner-gas-cooker',   'Appliances','Nasco',   'https://gh.jumia.com/placeholder/cooker.jpg',    '{"burners":4,"ignition":"auto","material":"steel"}',      'https://www.jumia.com.gh/gas-cooker-4-burner', 'seed'),
  ('LG 320L Fridge',           'lg-320l-fridge',        'Appliances','LG',      'https://gh.jumia.com/placeholder/fridge.jpg',    '{"capacity":"320L","energy":"A","doors":2}',             'https://www.jumia.com.gh/lg-fridge-320', 'seed'),
  ('Sony PS5 (Disc Edition)',  'sony-ps5-disc',         'Gaming',    'Sony',    'https://gh.jumia.com/placeholder/ps5.jpg',       '{"storage":"825GB","edition":"Disc"}',                   'https://www.jumia.com.gh/ps5', 'seed'),
  ('AirPods Pro (2nd Gen)',    'airpods-pro-2',         'Audio',     'Apple',   'https://gh.jumia.com/placeholder/airpods.jpg',   '{"anc":true,"battery":"30h"}',                            'https://www.jumia.com.gh/airpods-pro-2', 'seed'),
  ('HP Pavilion 15 Laptop',    'hp-pavilion-15',        'Laptops',   'HP',      'https://gh.jumia.com/placeholder/hp15.jpg',      '{"ram":"16GB","storage":"512GB SSD","display":"15.6 inch"}','https://www.jumia.com.gh/hp-pavilion-15', 'seed')
on conflict (slug) do nothing;

-- helper: attach an offer to a product by slug + vendor slug
do $$
declare
  p uuid; v uuid;
begin
  -- iPhone 13
  select id into p from public.products where slug = 'iphone-13-128gb';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 6200, 14, 'Accra', 1, 2, 45, 'https://www.jumia.com.gh/iphone-13', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 6450, 3, 'Kumasi', 2, 2, 60, 'https://www.jumia.com.gh/iphone-13', now());
  select id into v from public.vendors where slug = 'importcourier-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 7900, null, 'Import', 10, 18, 120, 'https://www.jumia.com.gh/iphone-13', now());

  -- Tecno Spark 20
  select id into p from public.products where slug = 'tecno-spark-20';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 1150, 42, 'Accra', 1, 2, 40, 'https://www.jumia.com.gh/tecno-spark-20', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 1199, 9, 'Kumasi', 2, 3, 55, 'https://www.jumia.com.gh/tecno-spark-20', now());

  -- Samsung A15
  select id into p from public.products where slug = 'samsung-galaxy-a15';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 1550, 21, 'Accra', 1, 2, 40, 'https://www.jumia.com.gh/galaxy-a15', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 1600, 5, 'Kumasi', 2, 3, 55, 'https://www.jumia.com.gh/galaxy-a15', now());

  -- Gas cooker
  select id into p from public.products where slug = '4-burner-gas-cooker';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 950, 11, 'Accra', 2, 4, 80, 'https://www.jumia.com.gh/gas-cooker-4-burner', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 990, 4, 'Kumasi', 3, 5, 90, 'https://www.jumia.com.gh/gas-cooker-4-burner', now());

  -- LG fridge
  select id into p from public.products where slug = 'lg-320l-fridge';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 4800, 3, 'Accra', 2, 4, 150, 'https://www.jumia.com.gh/lg-fridge-320', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 4950, 2, 'Kumasi', 3, 5, 160, 'https://www.jumia.com.gh/lg-fridge-320', now());

  -- PS5
  select id into p from public.products where slug = 'sony-ps5-disc';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 9200, 2, 'Accra', 1, 2, 60, 'https://www.jumia.com.gh/ps5', now());
  select id into v from public.vendors where slug = 'importcourier-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 10500, null, 'Import', 12, 20, 200, 'https://www.jumia.com.gh/ps5', now());

  -- AirPods Pro 2
  select id into p from public.products where slug = 'airpods-pro-2';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 2700, 8, 'Accra', 1, 2, 40, 'https://www.jumia.com.gh/airpods-pro-2', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 2800, 2, 'Kumasi', 2, 3, 55, 'https://www.jumia.com.gh/airpods-pro-2', now());

  -- HP Pavilion 15
  select id into p from public.products where slug = 'hp-pavilion-15';
  select id into v from public.vendors where slug = 'devicedeal-gh';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 8900, 5, 'Accra', 1, 3, 80, 'https://www.jumia.com.gh/hp-pavilion-15', now());
  select id into v from public.vendors where slug = 'mobilemall';
  insert into public.price_offers (product_id, vendor_id, price_ghs, stock_count, delivery_zone, delivery_days_min, delivery_days_max, delivery_fee_ghs, affiliate_url, last_checked_at)
  values (p, v, 9050, 1, 'Kumasi', 2, 4, 95, 'https://www.jumia.com.gh/hp-pavilion-15', now());
end $$;

-- sample price history (F11 chart): ~3 snapshots per offer, one week apart
insert into public.price_snapshots (offer_id, price_ghs, captured_at)
select o.id, o.price_ghs + (10 * gs)::numeric, now() - (gs * interval '7 days')
from public.price_offers o
cross join generate_series(0, 2) as gs;

-- two demo guides so the blog hub renders
insert into public.guides (title, slug, excerpt, body_md, published, updated_at) values
  ('Best phones under GH₵2,000 (updated weekly)', 'best-phones-under-2000-cedis',
   'Our weekly round-up of the phones worth your money, with live prices from named vendors.',
   '## What you get for the money

At this budget you can expect 128GB storage, dual SIM and a 90Hz display.

## The three we''d actually buy

| Phone | Price | Vendor |
|-------|-------|--------|
| Tecno Spark 20 | GH₵1,150 | DeviceDeal GH |
| Samsung A15 | GH₵1,550 | DeviceDeal GH |

*Prices checked on seed day — see the live tables on each product page.*',
   true, now()),
  ('How to spot a fake vendor before you pay', 'spot-a-fake-vendor',
   'The warning signs our checks team looks for, and the four questions to ask before any payment.',
   '## Too cheap to be true

If the price is far below every other vendor, that is the first red flag.

## The four questions

1. Is the vendor named?
2. Is the price in cedis, with delivery shown?
3. Does the vendor accept payment on delivery?
4. What do other buyers say?

*For a full checklist, see our Trust & Methodology page.*',
   true, now())
on conflict (slug) do nothing;
