// POST /api/admin/listings — admin creates a listing ON BEHALF of a vendor
// (Option B flow: the vendor sent name/price/photos via WhatsApp; the admin
// enters them here). Middleware enforces admin auth for /api/admin/*.
//
// Accepts multipart (photos under "images") or JSON (no photos).
// The listing ships status:"approved" — the admin IS the checks team, and
// the vendor's number was verified by WhatsApp before this form is filled.
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { cacheReset } from "@/lib/ttl-cache";
import {
  saveVendorListing,
  readVendorProfiles,
  upsertVendorProfile,
  updateVendorProfile,
} from "@/lib/store";
import { categories } from "@/data/seed";
import { slugify } from "@/lib/utils";
import { collectImageFiles, saveListingImages } from "@/lib/uploads";
import { phoneKey } from "@/lib/plans";

async function readBody(request: NextRequest): Promise<
  | { fields: Record<string, string>; images: { name: string; contentType: string; size: number; buffer: Buffer }[] }
  | { error: string }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return { error: "Invalid form data." };
    }
    const fields: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string" && !(key in fields)) fields[key] = value;
    }
    return { fields, images: await collectImageFiles(form) };
  }
  try {
    const json = (await request.json()) as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === "string") fields[k] = v;
      else if (v === null) fields[k] = "";
      else fields[k] = String(v);
    }
    return { fields, images: [] };
  } catch {
    return { error: "Invalid JSON body." };
  }
}

export async function POST(request: NextRequest) {
  const parsed = await readBody(request);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.fields;
  const images = parsed.images;
  const str = (v: string | undefined) => (v ?? "").trim();
  const num = (v: string | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const businessName = str(body.businessName);
  const contactName = str(body.contactName);
  const phone = str(body.phone).replace(/[^0-9]/g, "");
  const productName = str(body.productName);
  const priceGhs = Number(body.priceGhs);
  const category = str(body.category);
  const stockRaw = str(body.stockCount);
  const description = str(body.description);
  const websiteUrl = str(body.websiteUrl);

  if (businessName.length < 2) return NextResponse.json({ error: "Enter the vendor's business name." }, { status: 400 });
  if (phone.length < 9 || phone.length > 15) return NextResponse.json({ error: "Enter the vendor's phone / WhatsApp number." }, { status: 400 });
  if (productName.length < 3) return NextResponse.json({ error: "Enter the product name." }, { status: 400 });
  if (!Number.isFinite(priceGhs) || priceGhs <= 0) return NextResponse.json({ error: "Enter a realistic price in cedis." }, { status: 400 });
  if (!categories.some((c) => c.slug === category)) return NextResponse.json({ error: "Pick a valid category." }, { status: 400 });

  const stockCount = stockRaw !== "" ? Math.max(0, Math.round(num(stockRaw))) : null;
  const deliveryZone = str(body.deliveryZone) || "Ghana";
  const deliveryDaysMin = Math.min(60, Math.max(1, num(body.deliveryDaysMin) || 1));
  const deliveryDaysMax = Math.min(60, Math.max(deliveryDaysMin, num(body.deliveryDaysMax) || deliveryDaysMin));
  const deliveryFeeGhs = num(body.deliveryFeeGhs);

  // Link to the vendor's profile when one exists (same phone-key rule the
  // rest of the marketplace uses). If there is none, create an approved
  // profile so the shop page + share card exist immediately — the admin
  // already verified the number via WhatsApp.
  let vendorId: string | null = null;
  const profiles = await readVendorProfiles();
  const existing = profiles.find((p) => phoneKey(p.phone) === phoneKey(phone));
  if (existing) {
    vendorId = existing.id;
  } else {
    const created = await upsertVendorProfile({
      businessName,
      contactName,
      phone,
      email: str(body.email),
      websiteUrl,
      plan: "free",
      paymentStatus: "none",
    });
    if (created) {
      vendorId = created.id;
      await updateVendorProfile(created.id, { status: "approved" });
    }
  }

  const slug = `${slugify(productName)}-${Math.random().toString(36).slice(2, 8)}`;
  let imageUrls: string[] = [];
  if (images.length > 0) {
    // Admin may have only 1–2 photos from WhatsApp — don't enforce the
    // public form's 3-photo minimum here (the admin is the trusted party).
    const saved = await saveListingImages(slug, images, { requireMin: false });
    if (saved.ok) imageUrls = saved.urls;
  }

  const ok = await saveVendorListing({
    businessName,
    contactName,
    phone,
    email: str(body.email),
    productName,
    slug,
    category,
    priceGhs,
    stockCount,
    deliveryZone,
    deliveryDaysMin,
    deliveryDaysMax,
    deliveryFeeGhs,
    description,
    websiteUrl,
    imageUrls,
    vendorId,
    requestedPlan: "free",
    status: "approved",
  });
  if (!ok) return NextResponse.json({ error: "Could not save the listing." }, { status: 500 });

  cacheReset("marketplace-state");
  revalidatePath("/search");
  revalidatePath(`/category/${category}`);
  revalidatePath(`/product/${slug}`);

  return NextResponse.json({ ok: true, slug, vendorId });
}
