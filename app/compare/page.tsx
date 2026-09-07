import type { Metadata } from "next";
import { Suspense } from "react";
import CompareClient from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Products Side by Side — FindIt Ghana",
  description:
    "Pick up to 3 phones, laptops or appliances and compare specs, real cedi prices from all named shops, stock and delivery in one table.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-soft">
          Loading the comparison builder…
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
