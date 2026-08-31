import Link from "next/link";
import { VendorLogOutButton } from "@/components/vendor-logout-button";

export function VendorDashNav({
  businessName,
  active,
}: {
  businessName: string;
  active: "overview" | "listings";
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gold-700 dark:text-gold-500">FindIt Ghana · Shop</p>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-navy-100">{businessName}</h1>
        </div>
        <VendorLogOutButton />
      </div>
      <nav aria-label="Shop dashboard" className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {[
          ["/vendor", "Overview", "overview"],
          ["/vendor/listings", "Listings", "listings"],
        ].map(([href, label, key]) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              active === key ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-800 hover:bg-navy-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
