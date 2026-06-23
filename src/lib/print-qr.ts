import type { QrPrintColor } from "@/lib/qr";
import { qrColorHex, qrImageUrl } from "@/lib/qr";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Prints the welder QR code (optional dark color) with plant ID below, via a
 * hidden iframe so it never disturbs the current page. Client-only.
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
      color: ${ink};
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
