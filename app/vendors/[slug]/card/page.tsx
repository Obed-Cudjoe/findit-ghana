import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ShieldCheck, Printer } from "lucide-react";
import { getShopBySlug, getVendors, officialSources, siteConfig } from "@/lib/data";
import { VendorAvatar } from "@/components/vendor-avatar";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Shop share card",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const vendors = getVendors();
  return officialSources
    .map((s) => vendors.find((v) => v.name === s.name))
    .filter((v): v is NonNullable<typeof v> => !!v)
    .map((v) => ({ slug: v.slug }));
}

export default async function VendorCardPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const shopUrl = `${siteConfig.url}/vendors/${slug}`;
  const qr = await QRCode.toDataURL(shopUrl, { width: 240, margin: 1, color: { dark: "#0F2A43", light: "#FFFFFF" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="print:hidden text-sm text-slate-soft dark:text-navy-300">
        <Link href="/" className="hover:text-navy-700">Home</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/vendors/${slug}`} className="hover:text-navy-700">{shop.vendor.name}</Link>{" "}
        <span aria-hidden="true">›</span> <span className="text-navy-900 dark:text-navy-100">Share card</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-lg font-extrabold text-navy-900 dark:text-navy-100">
          {shop.vendor.name}&apos;s share card
        </h1>
        <PrintButton />
      </div>

      {/* The card — print/screenshot target */}
      <div className="mx-auto mt-4 max-w-sm overflow-hidden rounded-2xl border-2 border-navy-900 bg-white shadow-xl">
        <div className="bg-navy-900 px-6 pb-5 pt-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-400">
            Ghana&apos;s price finder
          </p>
          <p className="mt-1 text-xl font-extrabold text-white">findit-ghana.vercel.app</p>
        </div>

        <div className="flex flex-col items-center px-6 pb-7 pt-6">
          <VendorAvatar name={shop.vendor.name} hue={shop.vendor.logoHue} size="lg" />
          <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-center text-lg font-extrabold text-navy-900">
            {shop.vendor.name}
            {shop.vendor.verified && (
              <ShieldCheck className="h-4 w-4 text-emerald-600" aria-label="Verified shop" />
            )}
          </p>
          <p className="mt-1 text-center text-xs text-slate-soft">
            {shop.listingCount} live listing{shop.listingCount === 1 ? "" : "s"} · real prices, real stock
          </p>

          <div className="mt-4 rounded-xl border border-navy-100 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`QR code for ${shop.vendor.name} on FindIt Ghana`} width={240} height={240} />
          </div>

          <p className="mt-4 text-center text-sm font-semibold text-navy-900">
            Scan to see my products &amp; prices
          </p>
          <p className="mt-1 text-center text-[11px] text-slate-soft">
            Post me in your WhatsApp group, TikTok bio or shop window — shoppers scan, compare, contact you directly.
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-soft print:hidden">
        Tip: use the Print button and choose &quot;Save as PDF&quot; — the PDF is your printable card file.
      </p>
    </div>
  );
}
