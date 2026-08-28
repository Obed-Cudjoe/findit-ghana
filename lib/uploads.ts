// Vendor product photos — write-side storage with the same three tiers as
// lib/store.ts, so uploads work everywhere the rest of the site works:
//
//  1. SUPABASE MODE — images go to the public `vendor-images` storage bucket
//     (created by supabase/migrations/006_listing_images.sql). The listing
//     row stores the public URL in image_urls. This is the PRODUCTION path.
//
//  2. LOCAL FILES — on a developer machine, images are written to
//     public/uploads/vendor-images/... and served by Next.js at
//     /uploads/vendor-images/... . The listing row stores that relative URL.
//
//  3. REMOTE DEMO STORE — the shared JSON object cannot hold image bytes,
//     so on Vercel without Supabase, uploads are refused with a clear
//     message. (Same stance as the rest of the demo tier: fine for a demo,
//     not for a live marketplace.)
//
// The swap is automatic — no code changes needed in any tier.
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MIN_LISTING_IMAGES = 3;
export const MAX_LISTING_IMAGES = 6;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB per photo

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export interface CollectedImage {
  name: string;
  contentType: string;
  size: number;
  buffer: Buffer;
}

/** Pull every uploaded file off a multipart form (field name "images"). */
export async function collectImageFiles(form: FormData): Promise<CollectedImage[]> {
  const out: CollectedImage[] = [];
  for (const entry of form.getAll("images")) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    out.push({
      name: entry.name || "photo",
      contentType: entry.type || "",
      size: entry.size,
      buffer: Buffer.from(await entry.arrayBuffer()),
    });
  }
  return out;
}

/** First problem with a single file, or null when it passes. */
export function validateImageFile(file: CollectedImage): string | null {
  if (!IMAGE_TYPES[file.contentType]) {
    return `"${file.name}" is not a photo — use a JPG, PNG or WebP file.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is over 3 MB — compress it and try again.`;
  }
  return null;
}

/** Extension for a content type (validated callers only). */
export function imageExtension(contentType: string): string {
  return IMAGE_TYPES[contentType] ?? "jpg";
}

/**
 * Store one photo and return its public URL.
 * key shape: listings/<listing-slug>/<index>.<ext>
 */
export async function saveVendorImage(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.storage
      .from("vendor-images")
      .upload(key, buffer, { contentType, upsert: true });
    if (error) return { ok: false, error: `Could not store a photo (${error.message}).` };
    const { data } = supabase.storage.from("vendor-images").getPublicUrl(key);
    return { ok: true, url: data.publicUrl };
  }

  if (process.env.VERCEL) {
    return {
      ok: false,
      error:
        "Product photos need the Supabase database. Add the Supabase environment variables to enable photos (see the handoff notes).",
    };
  }

  // Local dev tier — Next.js serves /public/* for us.
  try {
    const filePath = path.join(process.cwd(), "public", "uploads", key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return { ok: true, url: `/uploads/${key}` };
  } catch {
    return { ok: false, error: "Could not store a photo on this server." };
  }
}

/**
 * Validate a batch of photos and store them, returning the public URLs in
 * order. Fails fast with the first problem (message is buyer-safe).
 */
export async function saveListingImages(
  slug: string,
  files: CollectedImage[],
): Promise<{ ok: true; urls: string[] } | { ok: false; error: string }> {
  if (files.length > 0 && files.length < MIN_LISTING_IMAGES) {
    return {
      ok: false,
      error: `Add at least ${MIN_LISTING_IMAGES} photos of the product — buyers look at them before contacting you.`,
    };
  }
  if (files.length > MAX_LISTING_IMAGES) {
    return { ok: false, error: `Use ${MAX_LISTING_IMAGES} photos or fewer.` };
  }
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const problem = validateImageFile(file);
    if (problem) return { ok: false, error: problem };
    const key = `listings/${slug}/${i + 1}.${imageExtension(file.contentType)}`;
    const saved = await saveVendorImage(key, file.buffer, file.contentType);
    if (!saved.ok) return { ok: false, error: saved.error };
    urls.push(saved.url);
  }
  return { ok: true, urls };
}
