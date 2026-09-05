// Write-side store with three tiers, tried in this order:
//
//  1. SUPABASE MODE — when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
//     are set, every submission is written to the free-tier Postgres database
//     (schema: supabase/migrations/001_init.sql). This is the PRODUCTION path.
//
//  2. LOCAL FILES — on a developer machine, submissions append to JSON files
//     under data/submissions/ (works because the local filesystem is writable).
//
//  3. REMOTE DEMO STORE — on Vercel's read-only serverless filesystem, local
//     writes fail, so demo-mode submissions are persisted to a shared public
//     JSON object. DEMO ONLY (public by design — anyone could write to it);
//     anonymous public report data, clearly unsuitable for production.
//     Connecting Supabase skips this tier entirely.
//
// The swap is automatic — no code changes needed in any tier.
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { makeRefCode, slugify } from "@/lib/utils";
import type { ReportRow, ContactRow, ClickRow, VendorListing, VendorProfile, VendorPlanId, VendorPaymentStatus, VendorProfileStatus, PriceAlert, ActualPriceRow } from "@/lib/types";
import { hueFromName, isPlanId, phoneKey } from "@/lib/plans";
import { deleteVendorListingPhotos } from "@/lib/uploads";
import { cached } from "@/lib/ttl-cache";

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function isSupabaseMode(): boolean {
  return getSupabase() !== null;
}

// Which write tier new submissions (reports, contact messages, vendor
// listings) would land in right now. Surfaced in the admin dashboard so the
// owner always knows whether vendor PII is sitting in the public demo store.
export type StorageTier = "supabase" | "local-files" | "public-demo-store";
export function storageTier(): StorageTier {
  if (isSupabaseMode()) return "supabase";
  if (process.env.VERCEL) return "public-demo-store"; // read-only serverless FS
  return "local-files";
}


// ---------- tier 2: local JSON files (dev machines) ----------
const SUB_DIR = path.join(process.cwd(), "data", "submissions");

function ensureDir() {
  if (!fs.existsSync(SUB_DIR)) fs.mkdirSync(SUB_DIR, { recursive: true });
}

function appendJson<T>(file: string, row: T): boolean {
  try {
    ensureDir();
    const filePath = path.join(SUB_DIR, file);
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
    existing.push(row);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    return true;
  } catch {
    return false;
  }
}

function readJson<T>(file: string): T[] {
  try {
    const filePath = path.join(SUB_DIR, file);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
  } catch {
    return [];
  }
}

function updateLocalJson<T extends { id: string }>(file: string, id: string, patch: Partial<T>): boolean {
  try {
    const filePath = path.join(SUB_DIR, file);
    if (!fs.existsSync(filePath)) return false;
    const rows = JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx] = { ...rows[idx], ...patch };
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
    return true;
  } catch {
    return false;
  }
}

/** Remove whole rows by id from a local JSON file (no-op when ids is empty). */
function removeLocalRows<T extends { id: string }>(file: string, ids: string[]): boolean {
  if (ids.length === 0) return true;
  try {
    const filePath = path.join(SUB_DIR, file);
    if (!fs.existsSync(filePath)) return false;
    const rows = JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
    const next = rows.filter((r) => !ids.includes(r.id));
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2));
    return true;
  } catch {
    return false;
  }
}

/** True when any of the local JSON files currently holds rows (local tier is live). */
function localHasAnyRows(...files: string[]): boolean {
  return files.some((file) => {
    try {
      const filePath = path.join(SUB_DIR, file);
      if (!fs.existsSync(filePath)) return false;
      const rows = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return Array.isArray(rows) && rows.length > 0;
    } catch {
      return false;
    }
  });
}

// ---------- tier 3: remote demo store (serverless-safe) ----------
const REMOTE_OBJECT_ID = "ff8081819ff5b11001a03565e685131e";
const REMOTE_URL = `https://api.restful-api.dev/objects/${REMOTE_OBJECT_ID}`;

interface RemoteState {
  reports: ReportRow[];
  contacts: ContactRow[];
  clicks: ClickRow[];
  guideOverrides: GuideOverride[];
  vendorListings: VendorListing[];
  vendorProfiles: VendorProfile[];
  priceAlerts: PriceAlert[];
  actualPrices: ActualPriceRow[];
}

async function readRemoteState(): Promise<RemoteState | null> {
  try {
    const res = await fetch(REMOTE_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const body = await res.json();
    const data = body?.data ?? {};
    return {
      reports: Array.isArray(data.reports) ? data.reports : [],
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
      clicks: Array.isArray(data.clicks) ? data.clicks : [],
      guideOverrides: Array.isArray(data.guideOverrides) ? data.guideOverrides : [],
      vendorListings: Array.isArray(data.vendorListings) ? data.vendorListings : [],
      vendorProfiles: Array.isArray(data.vendorProfiles) ? data.vendorProfiles : [],
      priceAlerts: Array.isArray(data.priceAlerts) ? data.priceAlerts : [],
      actualPrices: Array.isArray(data.actualPrices) ? data.actualPrices : [],
    };
  } catch {
    return null;
  }
}

async function writeRemoteState(state: RemoteState): Promise<boolean> {
  try {
    const res = await fetch(REMOTE_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "findit-ghana-demo", data: state }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------- Supabase row mappers (snake_case -> camelCase) ----------
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapReport = (r: any): ReportRow => ({
  id: r.id, refCode: r.ref_code, kind: r.kind,
  listingUrl: r.listing_url ?? "", vendorName: r.vendor_name ?? "",
  detail: r.detail, reporterEmail: r.reporter_email ?? "",
  status: r.status, createdAt: r.created_at,
});
const mapContact = (c: any): ContactRow => ({
  id: c.id, name: c.name, email: c.email, topic: c.topic, message: c.message, createdAt: c.created_at,
});
const mapClick = (c: any): ClickRow => ({
  id: String(c.id), productSlug: c.product_slug ?? "", vendorName: c.vendor_name ?? "",
  destinationUrl: c.destination_url, createdAt: c.created_at,
});
const mapActualPrice = (r: any): ActualPriceRow => ({
  id: r.id, productSlug: r.product_slug ?? "", pricePaidGhs: Number(r.price_paid_ghs ?? 0),
  shopName: r.shop_name ?? "", paidAt: r.paid_at ?? r.created_at,
  status: r.status, createdAt: r.created_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------- public write API (used by the API routes) ----------
export interface SaveReportInput {
  kind: ReportRow["kind"];
  listingUrl: string;
  vendorName: string;
  detail: string;
  reporterEmail: string;
}

export async function saveReport(input: SaveReportInput): Promise<{ ok: boolean; refCode: string }> {
  const refCode = makeRefCode();
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("reports").insert({
      kind: input.kind,
      listing_url: input.listingUrl || null,
      vendor_name: input.vendorName || null,
      detail: input.detail,
      reporter_email: input.reporterEmail || null,
      ref_code: refCode,
      status: "new",
    });
    if (error) return { ok: false, refCode: "" };
    return { ok: true, refCode };
  }
  const row: ReportRow = {
    id: crypto.randomUUID(),
    refCode,
    kind: input.kind,
    listingUrl: input.listingUrl,
    vendorName: input.vendorName,
    detail: input.detail,
    reporterEmail: input.reporterEmail,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  if (appendJson<ReportRow>("reports.json", row)) return { ok: true, refCode };
  const state = await readRemoteState();
  if (state) {
    state.reports.push(row);
    return { ok: await writeRemoteState(state), refCode };
  }
  return { ok: false, refCode: "" };
}

export async function saveContact(input: Omit<ContactRow, "id" | "createdAt">): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("contact_messages").insert({
      name: input.name, email: input.email, topic: input.topic, message: input.message,
    });
    return !error;
  }
  const row: ContactRow = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
  if (appendJson<ContactRow>("contact.json", row)) return true;
  const state = await readRemoteState();
  if (state) {
    state.contacts.push(row);
    return await writeRemoteState(state);
  }
  return false;
}

export async function saveClick(input: Omit<ClickRow, "id" | "createdAt">): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("click_events").insert({
      product_slug: input.productSlug,
      vendor_name: input.vendorName,
      destination_url: input.destinationUrl,
    });
    return !error;
  }
  const row: ClickRow = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
  if (appendJson<ClickRow>("clicks.json", row)) return true;
  const state = await readRemoteState();
  if (state) {
    state.clicks.push(row);
    return await writeRemoteState(state);
  }
  return false;
}

// ---------- guide overrides (admin content editor, P24) ----------
export interface GuideOverride {
  slug: string;
  excerpt: string;
  body: string;
}

export async function saveGuideOverride(override: GuideOverride): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("guides").update({ excerpt: override.excerpt, body_md: override.body }).eq("slug", override.slug);
    return !error;
  }
  if (saveLocalGuideOverride(override)) return true;
  const state = await readRemoteState();
  if (state) {
    const idx = state.guideOverrides.findIndex((g) => g.slug === override.slug);
    if (idx === -1) state.guideOverrides.push(override);
    else state.guideOverrides[idx] = override;
    return await writeRemoteState(state);
  }
  return false;
}

function saveLocalGuideOverride(override: GuideOverride): boolean {
  try {
    ensureDir();
    const filePath = path.join(SUB_DIR, "guides-overrides.json");
    const existing: GuideOverride[] = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : [];
    const idx = existing.findIndex((g) => g.slug === override.slug);
    if (idx === -1) existing.push(override);
    else existing[idx] = override;
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    return true;
  } catch {
    return false;
  }
}

export async function readGuideOverrides(): Promise<GuideOverride[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("guides").select("slug, excerpt, body_md");
    if (!error && data) return (data as any[]).map((g) => ({ slug: g.slug, excerpt: g.excerpt ?? "", body: g.body_md ?? "" }));
    return [];
  }
  const local = readJson<{ slug: string; excerpt: string; body: string }>("guides-overrides.json");
  if (local.length > 0) return local;
  const state = await readRemoteState();
  return state?.guideOverrides ?? [];
}

// ---------- admin read helpers (dashboard + queue pages) ----------
export async function readReports(): Promise<ReportRow[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (!error && data) return (data as any[]).map(mapReport);
    return [];
  }
  const local = readJson<ReportRow>("reports.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.reports ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readContactMessages(): Promise<ContactRow[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (!error && data) return (data as any[]).map(mapContact);
    return [];
  }
  const local = readJson<ContactRow>("contact.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.contacts ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function readClicks(limit = 200): Promise<ClickRow[]> {
  return cached(`clicks:${limit}`, 30_000, async () => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from("click_events").select("*").order("created_at", { ascending: false }).limit(limit);
      if (!error && data) return (data as any[]).map(mapClick);
      return [];
    }
    const local = readJson<ClickRow>("clicks.json");
    if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const state = await readRemoteState();
    return (state?.clicks ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
}

export async function updateReportStatus(id: string, status: ReportRow["status"]): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("reports").update({
      status,
      resolved_at: status === "fixed" || status === "dismissed" ? new Date().toISOString() : null,
    }).eq("id", id);
    return !error;
  }
  if (updateLocalJson<ReportRow>("reports.json", id, { status })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.reports.find((r) => r.id === id);
  if (!row) return false;
  row.status = status;
  return await writeRemoteState(state);
}

// ---------- vendor listings (the "List your product" flow) ----------
export interface SaveListingInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  productName: string;
  slug: string;
  category: string;
  priceGhs: number;
  stockCount: number | null;
  deliveryZone: string;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  deliveryFeeGhs: number;
  description: string;
  websiteUrl: string;
  imageUrls?: string[];
  vendorId?: string | null;
  requestedPlan?: VendorPlanId;
}

export async function saveVendorListing(input: SaveListingInput): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const base = {
      business_name: input.businessName,
      contact_name: input.contactName || null,
      phone: input.phone,
      email: input.email || null,
      product_name: input.productName,
      slug: input.slug,
      category: input.category,
      price_ghs: input.priceGhs,
      stock_count: input.stockCount,
      delivery_zone: input.deliveryZone,
      delivery_days_min: input.deliveryDaysMin,
      delivery_days_max: input.deliveryDaysMax,
      delivery_fee_ghs: input.deliveryFeeGhs,
      description: input.description,
      website_url: input.websiteUrl || null,
      status: "pending",
    };
    const imageUrls = (input.imageUrls ?? []).filter((u) => typeof u === "string" && u.length > 0);
    const withPlan = {
      ...base,
      vendor_id: input.vendorId || null,
      requested_plan: input.requestedPlan ?? "free",
    };
    const withImages = { ...withPlan, image_urls: imageUrls };
    const first = await supabase.from("vendor_listings").insert(withImages);
    if (!first.error) return true;
    // Migration 006 not applied yet — retry without the photos column.
    const second = await supabase.from("vendor_listings").insert(withPlan);
    if (!second.error) return true;
    // Migration 003 not applied yet — fall back to the original columns.
    const { error } = await supabase.from("vendor_listings").insert(base);
    return !error;
  }
  const row: VendorListing = {
    id: crypto.randomUUID(),
    ...input,
    vendorId: input.vendorId ?? null,
    requestedPlan: input.requestedPlan ?? "free",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (appendJson<VendorListing>("vendor-listings.json", row)) return true;
  const state = await readRemoteState();
  if (state) {
    state.vendorListings.push(row);
    return await writeRemoteState(state);
  }
  return false;
}

export async function readVendorListings(): Promise<VendorListing[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("vendor_listings").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return (data as any[]).map((l: any) => ({
        id: l.id, businessName: l.business_name, contactName: l.contact_name ?? "",
        phone: l.phone, email: l.email ?? "", productName: l.product_name, slug: l.slug,
        category: l.category, priceGhs: Number(l.price_ghs), stockCount: l.stock_count ?? null,
        deliveryZone: l.delivery_zone ?? "", deliveryDaysMin: l.delivery_days_min ?? 1,
        deliveryDaysMax: l.delivery_days_max ?? 3, deliveryFeeGhs: Number(l.delivery_fee_ghs ?? 0),
        description: l.description, websiteUrl: l.website_url ?? "",
        imageUrls: Array.isArray(l.image_urls)
          ? l.image_urls.filter((u: unknown) => typeof u === "string" && (u as string).length > 0)
          : [],
        status: l.status, createdAt: l.created_at,
        updatedAt: l.updated_at ?? l.created_at,
        featuredUntil: l.featured_until ?? null,
        vendorId: l.vendor_id ?? null,
        requestedPlan: isPlanId(l.requested_plan) ? l.requested_plan : "free",
      }));
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
    return [];
  }
  const local = readJson<VendorListing>("vendor-listings.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.vendorListings ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateVendorListingStatus(id: string, status: VendorListing["status"]): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("vendor_listings").update({ status }).eq("id", id);
    return !error;
  }
  if (updateLocalJson<VendorListing>("vendor-listings.json", id, { status })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.vendorListings.find((l) => l.id === id);
  if (!row) return false;
  row.status = status;
  return await writeRemoteState(state);
}

// Fields a vendor may edit on their own listing (PATCH /api/vendor/listings/[id]).
// Category, slug, photos and status are deliberately not here — the slug is
// fixed at listing time so the product link never breaks when a vendor renames
// their product (the new name shows everywhere, the URL stays the same).
export interface VendorListingPatch {
  productName?: string;
  priceGhs?: number;
  stockCount?: number | null;
  deliveryFeeGhs?: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  description?: string;
}

/**
 * Edit a vendor's own listing (price / stock / delivery / description).
 * Always bumps updated_at (= updatedAt), which drives the "Prices checked …"
 * freshness on the product page — approved edits go live immediately, with
 * no re-review, because status is not part of the patch.
 */
export async function updateVendorListing(id: string, patch: VendorListingPatch): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const db: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.productName !== undefined) db.product_name = patch.productName;
    if (patch.priceGhs !== undefined) db.price_ghs = patch.priceGhs;
    if (patch.stockCount !== undefined) db.stock_count = patch.stockCount;
    if (patch.deliveryFeeGhs !== undefined) db.delivery_fee_ghs = patch.deliveryFeeGhs;
    if (patch.deliveryDaysMin !== undefined) db.delivery_days_min = patch.deliveryDaysMin;
    if (patch.deliveryDaysMax !== undefined) db.delivery_days_max = patch.deliveryDaysMax;
    if (patch.description !== undefined) db.description = patch.description;
    const { error } = await supabase.from("vendor_listings").update(db).eq("id", id);
    return !error;
  }
  if (updateLocalJson<VendorListing>("vendor-listings.json", id, { ...patch, updatedAt: new Date().toISOString() })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.vendorListings.find((l) => l.id === id);
  if (!row) return false;
  Object.assign(row, patch, { updatedAt: new Date().toISOString() });
  return await writeRemoteState(state);
}

// ---------- featured placements (paid) ----------
// Featured until a future ISO timestamp => pinned first in its category and
// badged with ★. The admin sets/clears this after receiving the vendor's
// MoMo payment (GH₵50/month at launch — see /for-vendors "Get featured").
export async function setVendorListingFeatured(id: string, featuredUntil: string | null): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("vendor_listings")
      .update({ featured_until: featuredUntil })
      .eq("id", id);
    return !error;
  }
  if (updateLocalJson<VendorListing>("vendor-listings.json", id, { featuredUntil })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.vendorListings.find((l) => l.id === id);
  if (!row) return false;
  row.featuredUntil = featuredUntil;
  return await writeRemoteState(state);
}

// ---------- vendor profiles (plans, expiry, directory) ----------
export interface SaveVendorProfileInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  websiteUrl: string;
  plan: VendorPlanId;
  paymentStatus: VendorPaymentStatus;
  passwordHash?: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapVendorProfile(r: any): VendorProfile {
  return {
    id: r.id,
    businessName: r.business_name,
    slug: r.slug,
    contactName: r.contact_name ?? "",
    phone: r.phone,
    email: r.email ?? "",
    websiteUrl: r.website_url ?? "",
    plan: isPlanId(r.plan) ? r.plan : "free",
    planExpiresAt: r.plan_expires_at ?? null,
    paymentStatus: (r.payment_status as VendorPaymentStatus) ?? "none",
    momoReference: r.momo_reference ?? "",
    verified: !!r.verified,
    logoHue: Number(r.logo_hue ?? hueFromName(r.business_name ?? "")),
    status: (r.status as VendorProfileStatus) ?? "pending",
    createdAt: r.created_at,
    passwordHash: r.password_hash ?? r.passwordHash ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const RESERVED_VENDOR_SLUGS = new Set([
  "jumia-ghana", "compughana", "franko-trading", "telefonika",
  "devicedeal-gh", "mobilemall", "importcourier-gh", "nasco-electronics", "gadgetworks",
]);

async function uniqueVendorSlug(base: string, existing: { slug: string }[]): Promise<string> {
  const root = slugify(base) || "shop";
  const taken = new Set([...RESERVED_VENDOR_SLUGS, ...existing.map((p) => p.slug)]);
  if (!taken.has(root)) return root;
  for (let i = 2; i < 100; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function readVendorProfiles(): Promise<VendorProfile[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("vendor_profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) return (data as unknown[]).map(mapVendorProfile);
    return [];
  }
  const local = readJson<VendorProfile>("vendor-profiles.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.vendorProfiles ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findVendorProfileByPhone(phone: string): Promise<VendorProfile | undefined> {
  const key = phoneKey(phone);
  if (!key) return undefined;
  const all = await readVendorProfiles();
  return all.find((p) => phoneKey(p.phone) === key);
}

export async function findVendorProfileById(id: string): Promise<VendorProfile | undefined> {
  if (!id) return undefined;
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("vendor_profiles").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapVendorProfile(data);
    return undefined;
  }
  const all = await readVendorProfiles();
  return all.find((p) => p.id === id);
}

export function listingsForVendor(listings: VendorListing[], profile: VendorProfile): VendorListing[] {
  const key = phoneKey(profile.phone);
  return listings.filter((l) => {
    if (profile.id && l.vendorId === profile.id) return true;
    return phoneKey(l.phone) === key;
  });
}

export async function upsertVendorProfile(input: SaveVendorProfileInput): Promise<VendorProfile | null> {
  const existing = await findVendorProfileByPhone(input.phone);
  if (existing) {
    // Returning vendor: keep their current plan. A paid request is recorded on
    // the listing (requestedPlan) and confirmed later in /admin/vendors.
    const patch: Partial<VendorProfile> = {};
    if (input.contactName && !existing.contactName) patch.contactName = input.contactName;
    if (input.email && !existing.email) patch.email = input.email;
    if (input.websiteUrl && !existing.websiteUrl) patch.websiteUrl = input.websiteUrl;
    if (input.businessName && input.businessName !== existing.businessName && !existing.businessName) {
      patch.businessName = input.businessName;
    }
    // First-time paid request on a free shop: flag payment pending, don't grant the plan yet.
    if (input.plan !== "free" && existing.plan === "free" && existing.paymentStatus !== "confirmed") {
      patch.plan = input.plan;
      patch.paymentStatus = "pending";
    }
    if (input.passwordHash && !existing.passwordHash) patch.passwordHash = input.passwordHash;
    if (Object.keys(patch).length > 0) {
      await updateVendorProfile(existing.id, patch);
      return { ...existing, ...patch };
    }
    return existing;
  }

  const all = await readVendorProfiles();
  const slug = await uniqueVendorSlug(input.businessName, all);
  const row: VendorProfile = {
    id: crypto.randomUUID(),
    businessName: input.businessName,
    slug,
    contactName: input.contactName,
    phone: input.phone,
    email: input.email,
    websiteUrl: input.websiteUrl,
    plan: input.plan,
    planExpiresAt: null,
    paymentStatus: input.plan === "free" ? "none" : "pending",
    momoReference: "",
    verified: false,
    logoHue: hueFromName(input.businessName),
    status: "pending",
    createdAt: new Date().toISOString(),
    passwordHash: input.passwordHash ?? null,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("vendor_profiles").insert({
      id: row.id,
      business_name: row.businessName,
      slug: row.slug,
      contact_name: row.contactName || null,
      phone: row.phone,
      email: row.email || null,
      website_url: row.websiteUrl || null,
      plan: row.plan,
      plan_expires_at: null,
      payment_status: row.paymentStatus,
      momo_reference: null,
      verified: false,
      logo_hue: row.logoHue,
      status: "pending",
      password_hash: row.passwordHash || null,
    }).select("*").single();
    if (error) {
      const retry = await supabase.from("vendor_profiles").insert({
        id: row.id,
        business_name: row.businessName,
        slug: row.slug,
        contact_name: row.contactName || null,
        phone: row.phone,
        email: row.email || null,
        website_url: row.websiteUrl || null,
        plan: row.plan,
        plan_expires_at: null,
        payment_status: row.paymentStatus,
        momo_reference: null,
        verified: false,
        logo_hue: row.logoHue,
        status: "pending",
      }).select("*").single();
      if (retry.error || !retry.data) return null;
      return mapVendorProfile(retry.data);
    }
    if (!data) return null;
    return mapVendorProfile(data);
  }

  if (appendJson<VendorProfile>("vendor-profiles.json", row)) return row;
  const state = await readRemoteState();
  if (state) {
    state.vendorProfiles.push(row);
    const ok = await writeRemoteState(state);
    return ok ? row : null;
  }
  return null;
}

export async function updateVendorProfile(id: string, patch: Partial<VendorProfile>): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const db: Record<string, unknown> = {};
    if (patch.businessName !== undefined) db.business_name = patch.businessName;
    if (patch.contactName !== undefined) db.contact_name = patch.contactName || null;
    if (patch.phone !== undefined) db.phone = patch.phone;
    if (patch.email !== undefined) db.email = patch.email || null;
    if (patch.websiteUrl !== undefined) db.website_url = patch.websiteUrl || null;
    if (patch.plan !== undefined) db.plan = patch.plan;
    if (patch.planExpiresAt !== undefined) db.plan_expires_at = patch.planExpiresAt;
    if (patch.paymentStatus !== undefined) db.payment_status = patch.paymentStatus;
    if (patch.momoReference !== undefined) db.momo_reference = patch.momoReference || null;
    if (patch.verified !== undefined) db.verified = patch.verified;
    if (patch.logoHue !== undefined) db.logo_hue = patch.logoHue;
    if (patch.status !== undefined) db.status = patch.status;
    if (patch.passwordHash !== undefined) db.password_hash = patch.passwordHash || null;
    if (Object.keys(db).length === 0) return true;
    const { error } = await supabase.from("vendor_profiles").update(db).eq("id", id);
    return !error;
  }
  if (updateLocalJson<VendorProfile>("vendor-profiles.json", id, patch)) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.vendorProfiles.find((p) => p.id === id);
  if (!row) return false;
  Object.assign(row, patch);
  return await writeRemoteState(state);
}

export function countActiveListingsForVendor(listings: VendorListing[], profile: VendorProfile): number {
  return listingsForVendor(listings, profile).filter((l) => l.status !== "rejected").length;
}

// ---------- admin: delete a shop (suspected fraud / bad actor) ----------
/**
 * Permanently remove a shop in this order:
 *   (a) every listing it owns — the caller passes the exact set from
 *       listingsForVendor(), which covers both the vendor_id match and the
 *       legacy phone-key match;
 *   (b) the shop's uploaded photos (Supabase Storage objects / local
 *       public/uploads folders — see lib/uploads.ts);
 *   (c) the vendor_profiles row itself.
 *
 * Click events and buyer reports are intentionally NOT touched — they stay
 * as the audit trail when the owner is reporting a bad actor.
 */
export async function deleteVendorProfile(
  id: string,
  opts: { listings: VendorListing[]; phone: string },
): Promise<boolean> {
  const listingIds = opts.listings.map((l) => l.id);
  const supabase = getSupabase();
  const localTier = !supabase && localHasAnyRows("vendor-listings.json", "vendor-profiles.json");

  // (a) all listings owned by the shop.
  if (supabase) {
    if (listingIds.length > 0) {
      const { error } = await supabase.from("vendor_listings").delete().in("id", listingIds);
      if (error) return false;
    }
  } else if (localTier) {
    if (!removeLocalRows<VendorListing>("vendor-listings.json", listingIds)) return false;
  } else {
    const state = await readRemoteState();
    if (!state) return false;
    state.vendorListings = state.vendorListings.filter((l) => !listingIds.includes(l.id));
    if (!(await writeRemoteState(state))) return false;
  }

  // (b) the shop's uploaded photos — best-effort, never blocks the rows.
  await deleteVendorListingPhotos(opts.listings);

  // (c) the vendor_profiles row itself.
  if (supabase) {
    const { error } = await supabase.from("vendor_profiles").delete().eq("id", id);
    return !error;
  }
  if (localTier) return removeLocalRows<VendorProfile>("vendor-profiles.json", [id]);
  const state = await readRemoteState();
  if (!state) return false;
  state.vendorProfiles = state.vendorProfiles.filter((p) => p.id !== id);
  return await writeRemoteState(state);
}

// ---------- price snapshots (price-history chart + drop badges) ----------
export async function readOfferSnapshots(
  offerId: string
): Promise<{ offerId: string; priceGhs: number; capturedAt: string }[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("price_snapshots")
    .select("offer_id, price_ghs, captured_at")
    .eq("offer_id", offerId)
    .order("captured_at", { ascending: true });
  if (error || !data) return [];
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data as any[]).map((s: any) => ({
    offerId: s.offer_id,
    priceGhs: Number(s.price_ghs),
    capturedAt: s.captured_at,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// ---------- price-drop alerts (WhatsApp watchlist) ----------
// Subscriptions live in the same three-tier store as everything else.
// In Supabase mode the refresh cron checks them after recording snapshots
// and flips matching rows to "triggered"; the admin dashboard shows
// triggered alerts with one-tap wa.me links for manual delivery.

export async function savePriceAlert(input: {
  productSlug: string;
  productName: string;
  phone: string;
  targetPriceGhs: number;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("price_alerts").insert({
      product_slug: input.productSlug,
      product_name: input.productName,
      phone: input.phone,
      target_price_ghs: input.targetPriceGhs,
      status: "active",
    });
    return !error;
  }
  const row: PriceAlert = {
    id: crypto.randomUUID(),
    ...input,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  if (appendJson<PriceAlert>("price-alerts.json", row)) return true;
  const state = await readRemoteState();
  if (!state) return false;
  state.priceAlerts.push(row);
  return await writeRemoteState(state);
}

export async function readPriceAlerts(): Promise<PriceAlert[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("price_alerts").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return (data as any[]).map((a: any) => ({
        id: a.id,
        productSlug: a.product_slug,
        productName: a.product_name,
        phone: a.phone,
        targetPriceGhs: Number(a.target_price_ghs),
        status: a.status,
        createdAt: a.created_at,
        triggeredAt: a.triggered_at ?? undefined,
      }));
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
    return [];
  }
  const local = readJson<PriceAlert>("price-alerts.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.priceAlerts ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updatePriceAlertStatus(id: string, status: PriceAlert["status"]): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("price_alerts")
      .update({ status, triggered_at: status === "triggered" ? new Date().toISOString() : null })
      .eq("id", id);
    return !error;
  }
  if (updateLocalJson<PriceAlert>("price-alerts.json", id, { status })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.priceAlerts.find((a) => a.id === id);
  if (!row) return false;
  row.status = status;
  return await writeRemoteState(state);
}

// ---------- actual prices paid (COMP-19: asking vs. paid honesty data) ----------
export async function saveActualPrice(input: {
  productSlug: string;
  pricePaidGhs: number;
  shopName?: string;
}): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("actual_prices").insert({
      product_slug: input.productSlug,
      price_paid_ghs: input.pricePaidGhs,
      shop_name: input.shopName || null,
      status: "new",
    });
    return !error;
  }
  const row: ActualPriceRow = {
    id: crypto.randomUUID(),
    productSlug: input.productSlug,
    pricePaidGhs: input.pricePaidGhs,
    shopName: input.shopName,
    paidAt: new Date().toISOString(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  if (appendJson<ActualPriceRow>("actual-prices.json", row)) return true;
  const state = await readRemoteState();
  if (state) {
    state.actualPrices.push(row);
    return await writeRemoteState(state);
  }
  return false;
}

export async function readActualPrices(): Promise<ActualPriceRow[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from("actual_prices").select("*").order("created_at", { ascending: false });
    if (!error && data) return (data as any[]).map(mapActualPrice);
    return [];
  }
  const local = readJson<ActualPriceRow>("actual-prices.json");
  if (local.length > 0) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const state = await readRemoteState();
  return (state?.actualPrices ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateActualPriceStatus(id: string, status: ActualPriceRow["status"]): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("actual_prices").update({ status }).eq("id", id);
    return !error;
  }
  if (updateLocalJson<ActualPriceRow>("actual-prices.json", id, { status })) return true;
  const state = await readRemoteState();
  if (!state) return false;
  const row = state.actualPrices.find((r) => r.id === id);
  if (!row) return false;
  row.status = status;
  return await writeRemoteState(state);
}
