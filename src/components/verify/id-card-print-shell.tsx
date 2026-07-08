"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export function IdCardPrintShell({
  backHref,
  backLabel,
  badge,
  showPrint = true,
  children,
}: {
  backHref: string;
  backLabel: string;
  badge: string;
  showPrint?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-parchment px-4 py-6 print:bg-white print:p-0">
      <div className="relative mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-steel">{badge}</span>
            {showPrint ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            ) : null}
          </div>
        </div>

        {children}

        <p
          className="pointer-events-none mt-3 text-right text-[10px] text-steel/35 print:absolute print:bottom-0 print:right-0 print:mt-0"
          aria-hidden
        >
          {BRAND_NAME}
        </p>
      </div>
    </div>
  );
}
