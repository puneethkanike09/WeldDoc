"use client";

import { ShieldCheck, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

interface AuditorQrCardProps {
  qrToken: string;
  plantWelderId: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function printQrOnly(qrToken: string, plantWelderId: string) {
  const qrSrc = `${window.location.origin}/api/qr/${qrToken}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QR — ${escapeHtml(plantWelderId)}</title>
  <style>
    @page { margin: 12mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    img { width: 280px; height: 280px; }
    .plant-id {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <img src="${qrSrc}" alt="QR code" width="280" height="280" />
    <p class="plant-id">${escapeHtml(plantWelderId)}</p>
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    width: "0",
    height: "0",
    border: "none",
    visibility: "hidden",
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 500);
  };

  const printFrame = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  };

  const img = doc.querySelector("img");
  if (img && !img.complete) {
    img.onload = printFrame;
    img.onerror = printFrame;
  } else {
    window.setTimeout(printFrame, 100);
  }
}

export function AuditorQrCard({ qrToken, plantWelderId }: AuditorQrCardProps) {
  return (
    <Card>
      <CardBody className="text-center">
        <p className="mb-3 font-display text-[13px] font-medium text-charcoal">
          Auditor QR code
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${qrToken}`}
          alt="Welder verification QR code"
          className="mx-auto h-40 w-40 rounded-[10px] border border-silver p-2"
        />
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-graphite">
          <ShieldCheck className="h-3.5 w-3.5 text-active-ink" />
          Scan to verify live status
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => printQrOnly(qrToken, plantWelderId)}
          >
            <Printer className="h-4 w-4" />
            Print QR
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
