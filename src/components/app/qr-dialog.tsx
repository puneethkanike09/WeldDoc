"use client";

import { useState } from "react";
import { QrCode, ShieldCheck, Printer, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/sui/dialog";
import { printQrWithId } from "@/lib/print-qr";
import { copyQrImage } from "@/lib/print-bulk-qr";
import {
  QR_PRINT_COLORS,
  qrImageUrl,
  type QrPrintColor,
} from "@/lib/qr";
import { toast } from "sonner";

export function QrDialog({
  qrToken,
  plantWelderId,
}: {
  qrToken: string;
  plantWelderId: string;
}) {
  const [color, setColor] = useState<QrPrintColor>("black");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <QrCode className="h-4 w-4" /> QR code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs text-center">
        <DialogHeader className="text-center">
          <DialogCloseButton />
          <DialogTitle className="text-base">Verification QR code</DialogTitle>
          <DialogDescription className="sr-only">
            Scan this code to verify the welder&apos;s live qualification
            status. Choose a print color before printing.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={color}
            src={qrImageUrl(qrToken, color)}
            alt="Welder verification QR code"
            className="mx-auto h-56 w-56 rounded-[10px] border border-silver bg-white p-2"
          />
          <p className="mt-3 font-display text-lg font-semibold text-onyx">
            {plantWelderId}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-graphite">
            <ShieldCheck className="h-3.5 w-3.5 text-active-ink" />
            Scan to verify live status
          </p>

          <div className="mt-5 flex justify-center gap-2">
            {QR_PRINT_COLORS.map((option) => {
              const selected = color === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={selected}
                  onClick={() => setColor(option.id)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border-2 bg-white transition-colors hover:opacity-90",
                    selected
                      ? "border-ember ring-2 ring-ember/25 ring-offset-2 ring-offset-popover"
                      : "border-silver",
                  )}
                >
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: option.swatch }}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="subtle"
              size="sm"
              onClick={async () => {
                try {
                  await copyQrImage(qrToken, color);
                  toast.success("QR copied — paste into Word or a label sheet.");
                } catch {
                  toast.error("Could not copy QR to clipboard.");
                }
              }}
            >
              <Copy className="h-4 w-4" />
              Copy image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => printQrWithId(qrToken, plantWelderId, color)}
            >
              <Printer className="h-4 w-4" />
              Print QR
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
