import type { QrPrintColor } from "@/lib/qr";
import { qrColorHex, qrImageUrl } from "@/lib/qr";
import {
  escapeHtml,
  openPrintDocument,
  QR_LABEL_INCH,
} from "@/lib/print-qr-shared";

/**
 * Prints a 1-inch welder QR label with plant ID below, via a hidden iframe.
 * Client-only.
 */
export function printQrWithId(
  qrToken: string,
  plantWelderId: string,
  color: QrPrintColor = "black",
) {
  const qrSrc = `${window.location.origin}${qrImageUrl(qrToken, color)}`;
  const ink = qrColorHex(color);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>QR — ${escapeHtml(plantWelderId)}</title>
  <style>
    @page { margin: 8mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      min-height: 100vh;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: ${QR_LABEL_INCH};
      text-align: center;
      page-break-inside: avoid;
    }
    img { width: ${QR_LABEL_INCH}; height: ${QR_LABEL_INCH}; display: block; }
    .plant-id {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 6pt;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: ${ink};
      margin-top: 1mm;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <img src="${qrSrc}" alt="QR code" />
    <p class="plant-id">${escapeHtml(plantWelderId)}</p>
  </div>
</body>
</html>`;

  openPrintDocument(html, () => {});
}
