"use client";

/* Print/screenshot button for share cards — triggers the browser's print
   dialog (users save as PDF). The card is the only printable content:
   page.tsx hides navigation/buttons with print:hidden. */

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-700"
    >
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </button>
  );
}
