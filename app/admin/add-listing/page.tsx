import type { Metadata } from "next";
import { AddListingForm } from "./add-form";

export const metadata: Metadata = { title: "Add Listing for a Vendor", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminAddListingPage() {
  return (
    <div>
      <p className="text-sm text-slate-soft dark:text-navy-300">
        For the Option B flow: a vendor sent you their name, price and photos via WhatsApp. Enter them here and the
        listing goes live <strong className="text-navy-900 dark:text-navy-100">immediately, pre-approved</strong> (you
        are the checks team — their number was verified by WhatsApp).
      </p>
      <div className="mt-4">
        <AddListingForm />
      </div>
    </div>
  );
}
