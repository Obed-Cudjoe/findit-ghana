"use client";

import { useEffect } from "react";

/** Fire-and-forget page-view ping (vendor profile / product) into the clicks table. */
export function ViewTracker({
  productSlug,
  vendorName,
  destinationUrl,
}: {
  productSlug: string;
  vendorName: string;
  destinationUrl: string;
}) {
  useEffect(() => {
    fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, vendorName, destinationUrl }),
    }).catch(() => {
      /* tracking is best-effort */
    });
  }, [productSlug, vendorName, destinationUrl]);
  return null;
}
