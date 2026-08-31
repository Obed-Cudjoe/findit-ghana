// Vendor product photos — write-side storage with the same three tiers as
// lib/store.ts, so uploads work everywhere the rest of the site works:
//
//  1. SUPABASE MODE — images go to the public `vendor-images` storage bucket
//     (created by supabase/migrations/006_listing_images.sql). The listing
//     row stores the public URL in image_urls. This is the PRODUCTION path.
//
//  2. LOCAL FILES — on a developer machine, images are written under
//     public/uploads/ (key shape listings/<slug>/<n>.<ext> → public/uploads/
//     listings/<slug>/...) and served by Next.js at /uploads/... . The
//     listing row stores that relative URL.
//
//  3. REMOTE DEMO STORE — the shared JSON object cannot hold image bytes,
//     so on Vercel without Supabase, uploads are refused with a clear
//     message. (Same stance as the rest of the demo tier: fine for a demo,
//     not for a live marketplace.)
//
// The swap is automatic — no code changes needed in any tier.
//
// Every upload is also AUTO-COMPRESSED server-side (before the tier write):
// the longest side is resized to <= MAX_IMAGE_EDGE and the image is
// re-encoded at quality ~80 (JPEG for JPG/PNG input, WebP stays WebP). A
// ~3 MB phone photo therefore ends up stored well under ~500 KB while still
// looking sharp in the buyer gallery — and it costs vendors less to upload
// on mobile data, because the browser downscales first (the server pass is
// still the source of truth).
import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";

export const MIN_LISTING_IMAGES = 3;
export const MAX_LISTING_IMAGES = 6;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB per photo (incoming cap)

// Server-side compression settings (see header comment).
// Tuned for the FREE Supabase tier (1 GB storage): 1280px is ample for the
// gallery display (max ~600px wide, so it still covers 2x/retina), and
// quality ~72 is visually indistinguishable from 80 at this size while
// cutting bytes by roughly a third. A 12MP phone photo typically lands at
// ~120–220 KB after this pass.
export const MAX_IMAGE_EDGE = 1280; // longest side in px after resizing
export const IMAGE_JPEG_QUALITY = 72;
export const IMAGE_WEBP_QUALITY = 72;

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

/** MIME type a validated photo is STORED as after compression (PNG → JPEG). */
export function imageOutputType(contentType: string): string {
  return contentType === "image/webp" ? "image/webp" : "image/jpeg";
}

/** Extension for the stored key — always matches the stored format. */
export function imageExtension(contentType: string): string {
  return contentType === "image/webp" ? "webp" : "jpg";
}

/**
 * Compress a validated photo before it reaches the storage tier:
 *   - resize so the longest side is <= MAX_IMAGE_EDGE (never upscale),
 *   - re-encode to JPEG quality ~80 (WebP input keeps WebP quality ~80;
 *     PNG is re-encoded to JPEG — its pixel data survives the resize),
 *   - apply the EXIF orientation from phone cameras.
 * If sharp cannot decode the file, the original bytes are returned unchanged
 * so a corrupt upload never hard-fails the whole listing.
 */
export async function compressImage(file: CollectedImage): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const outType = imageOutputType(file.contentType);
    const pipeline = sharp(file.buffer, { failOn: "none" })
      .rotate()
      .resize(MAX_IMAGE_EDGE, MAX_IMAGE_EDGE, { fit: "inside", withoutEnlargement: true });
    const buffer =
      outType === "image/webp"
        ? await pipeline.webp({ quality: IMAGE_WEBP_QUALITY }).toBuffer()
        : await pipeline.jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { buffer, contentType: outType };
  } catch {
    return { buffer: file.buffer, contentType: file.contentType };
  }
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
 * Validate a batch of photos, compress each one, and store them, returning
 * the public URLs in order. Fails fast with the first problem (message is
 * buyer-safe). Compression happens here, before the tier write, so the
 * stored file is always the compressed one — in every storage tier.
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
    const compressed = await compressImage(file);
    const key = `listings/${slug}/${i + 1}.${imageExtension(file.contentType)}`;
    const saved = await saveVendorImage(key, compressed.buffer, compressed.contentType);
    if (!saved.ok) return { ok: false, error: saved.error };
    urls.push(saved.url);
  }
  return { ok: true, urls };
}

/**
 * Delete every stored photo belonging to the given listings (admin shop
 * deletion). Best-effort by design — a storage hiccup must never block the
 * shop's profile/listing rows from being removed.
 *
 *  - Supabase: removes every object under listings/<slug>/ in the bucket.
 *    Keys are derived from the stored image_urls plus a folder listing, so
 *    all key shapes are caught.
 *  - Local dev: removes the public/uploads/listings/<slug>/ folders.
 *  - Demo tier: no-op (uploads are refused there, so nothing can exist).
 */
export async function deleteVendorListingPhotos(
  listings: { slug: string; imageUrls?: string[] }[],
): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const keys = new Set<string>();
    for (const l of listings) {
      for (const url of l.imageUrls ?? []) {
        const idx = url.indexOf("/vendor-images/");
        if (idx !== -1) keys.add(url.slice(idx + "/vendor-images/".length));
      }
      const prefix = `listings/${l.slug}/`;
      try {
        // list() takes the folder path (no trailing slash); f.name is the
        // object name inside it, so the full key is prefix + f.name.
        const { data } = await supabase.storage
          .from("vendor-images")
          .list(`listings/${l.slug}`, { limit: 100 });
        for (const f of data ?? []) keys.add(`${prefix}${f.name}`);
      } catch {
        /* keep going with the keys derived from the URLs */
      }
    }
    if (keys.size === 0) return true;
    const { error } = await supabase.storage.from("vendor-images").remove([...keys]);
    return !error;
  }

  // Local dev tier — delete each listing's photo folder outright.
  try {
    for (const l of listings) {
      const folder = path.join(process.cwd(), "public", "uploads", "listings", l.slug);
      fs.rmSync(folder, { recursive: true, force: true });
    }
    return true;
  } catch {
    return false;
  }
}
