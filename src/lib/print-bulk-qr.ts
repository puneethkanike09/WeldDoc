import type { QrPrintColor } from "@/lib/qr";
import { qrColorHex, qrImageUrl } from "@/lib/qr";

export interface BulkQrEntry {
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

/**
 * Prints a sheet of 1" × 1" QR stickers (one per welder) for cut-and-paste labels.
 * Client-only.
 */
export function printBulkQr(
  entries: BulkQrEntry[],
  color: QrPrintColor = "black",
) {
  if (entries.length === 0) return;

  const origin = window.location.origin;
  const ink = qrColorHex(color);
  const cells = entries
    .map((e) => {
      const src = `${origin}${qrImageUrl(e.qrToken, color)}`;
      return `<div class="sticker">
  <img src="${src}" alt="" width="72" height="72" />
  <p class="id">${escapeHtml(e.plantWelderId)}</p>
</div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WeldDoc — QR stickers</title>
  <style>
    @page { margin: 10mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4mm;
      align-content: flex-start;
    }
    .sticker {
      width: 1in;
      height: 1.15in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      page-break-inside: avoid;
    }
    .sticker img {
      width: 1in;
      height: 1in;
      object-fit: contain;
    }
    .id {
      font-size: 6pt;
      font-weight: 700;
      color: ${ink};
      text-align: center;
      line-height: 1.1;
      max-width: 1in;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="grid">${cells}</div>
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

  const cleanup = () => window.setTimeout(() => iframe.remove(), 500);
  const printFrame = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  };

  const imgs = doc.querySelectorAll("img");
  let loaded = 0;
  const tryPrint = () => {
    loaded += 1;
    if (loaded >= imgs.length) printFrame();
  };

  if (imgs.length === 0) {
    window.setTimeout(printFrame, 100);
    return;
  }

  imgs.forEach((img) => {
    if (img.complete) tryPrint();
    else {
      img.onload = tryPrint;
      img.onerror = tryPrint;
    }
  });
}

/** Copy a QR PNG to the clipboard for paste into Word etc. */
export async function copyQrImage(
  qrToken: string,
  color: QrPrintColor = "black",
): Promise<void> {
  const url = `${window.location.origin}${qrImageUrl(qrToken, color)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load QR image.");
  const blob = await res.blob();
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard not supported in this browser.");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
}
