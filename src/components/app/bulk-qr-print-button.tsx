"use client";

import { useState } from "react";
import { Printer, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printBulkQr, type BulkQrEntry } from "@/lib/print-bulk-qr";
import {
  QR_PRINT_COLORS,
  type QrPrintColor,
} from "@/lib/qr";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BulkQrPrintButton({
  welders,
}: {
  welders: BulkQrEntry[];
}) {
  const [color, setColor] = useState<QrPrintColor>("black");

  if (welders.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-[10px] border border-silver bg-panel px-2 py-1">
        {QR_PRINT_COLORS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-label={option.label}
            aria-pressed={color === option.id}
            onClick={() => setColor(option.id)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-colors",
              color === option.id
                ? "border-ember ring-2 ring-ember/20"
                : "border-transparent",
            )}
            style={{ backgroundColor: option.swatch }}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="subtle"
        size="sm"
        onClick={() => {
          printBulkQr(welders, color);
          toast.success(`Printing ${welders.length} QR sticker(s)…`);
        }}
      >
        <Printer className="h-4 w-4" />
        Print all QR codes
      </Button>
      <span className="hidden text-xs text-steel sm:inline">
        <QrCode className="mr-1 inline h-3.5 w-3.5" />
        1″ × 1″ stickers
      </span>
    </div>
  );
}
