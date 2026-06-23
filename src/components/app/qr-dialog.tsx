"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { QrCode, ShieldCheck, Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { printQrWithId } from "@/lib/print-qr";
import {
  QR_PRINT_COLORS,
  qrImageUrl,
  type QrPrintColor,
} from "@/lib/qr";

export function QrDialog({
  qrToken,
  plantWelderId,
}: {
  qrToken: string;
  plantWelderId: string;
}) {
  const [color, setColor] = useState<QrPrintColor>("black");

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <QrCode className="h-4 w-4" /> QR code
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-onyx/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[16px] border border-border bg-popover p-6 text-center text-popover-foreground shadow-(--shadow-lift) data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-sm text-steel hover:bg-onyx/5 hover:text-onyx"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <Dialog.Title className="font-display text-base font-semibold text-onyx">
            Auditor QR code
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Scan this code to verify the welder&apos;s live qualification
            status. Choose a print color before printing.
          </Dialog.Description>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={color}
            src={qrImageUrl(qrToken, color)}
            alt="Welder verification QR code"
            className="mx-auto mt-4 h-56 w-56 rounded-[10px] border border-silver bg-white p-2"
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

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-4 w-full"
            onClick={() => printQrWithId(qrToken, plantWelderId, color)}
          >
            <Printer className="h-4 w-4" />
            Print QR
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
