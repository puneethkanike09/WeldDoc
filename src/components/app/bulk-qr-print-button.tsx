"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printBulkQrLabels, type BulkQrEntry } from "@/lib/print-bulk-qr";

export function BulkQrPrintButton({ entries }: { entries: BulkQrEntry[] }) {
  if (!entries.length) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => printBulkQrLabels(entries)}
    >
      <Printer className="h-4 w-4" />
      Print all QR
    </Button>
  );
}
