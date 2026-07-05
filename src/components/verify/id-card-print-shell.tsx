"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

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
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          {showPrint ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          ) : null}
        </div>

        <div className="mb-6 flex items-center justify-between print:mb-4">
          <Logo />
          <span className="text-xs text-steel">{badge}</span>
        </div>

        {children}
      </div>
    </div>
  );
}
