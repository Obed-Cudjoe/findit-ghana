import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLoggedInVendor } from "@/lib/vendor-auth";
import { VendorLoginForm } from "@/components/vendor-login-form";

export const metadata: Metadata = { title: "Vendor login", robots: { index: false } };
export const dynamic = "force-dynamic";

function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/vendor";
  if (raw === "/vendor" || (raw.startsWith("/vendor/") && !raw.startsWith("/vendor/login"))) return raw;
  return "/vendor";
}

export default async function VendorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const vendor = await getLoggedInVendor();
  const { next } = await searchParams;
  const dest = safeNext(next);
  if (vendor) redirect(dest);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-navy-50/50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-700">FindIt Ghana · Shop login</p>
        <h1 className="mt-2 text-xl font-extrabold text-navy-900">Your vendor dashboard</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Sign in with the WhatsApp number on your listing. New shops set a password when they list on For vendors.
        </p>
        <VendorLoginForm nextPath={dest} />
      </div>
    </div>
  );
}
