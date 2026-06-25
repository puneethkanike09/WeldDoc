import type { QrPrintColor } from "@/lib/qr";
import { qrImageUrl } from "@/lib/qr";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface BulkQrEntry {
  qrToken: string;
  plantWelderId: string;
}

/** Print 1-inch QR labels for all welders (shop-floor badge sheet). */
export function printBulkQrLabels(entries: BulkQrEntry[]) {
  if (!entries.length) return;
  const origin = window.location.origin;
  const cells = entries
    .map(
      (e) => `<div class="cell">
        <img src="${origin}${qrImageUrl(e.qrToken, "black")}" width="96" height="96" alt="" />
        <p class="id">${escapeHtml(e.plantWelderId)}</p>
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  @page { margin: 8mm; }
  body { font-family: system-ui, sans-serif; margin: 0; }
  .grid { display: flex; flex-wrap: wrap; gap: 4mm; }
  .cell { width: 25.4mm; text-align: center; page-break-inside: avoid; }
  .cell img { width: 25.4mm; height: 25.4mm; }
  .id { font-size: 6pt; font-weight: 700; margin: 1mm 0 0; word-break: break-all; }
</style></head><body><div class="grid">${cells}</div></body></html>`;

  const iframe = document.createElement("iframe");
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
  const print = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 500);
  };
  const img = doc.querySelector("img");
  if (img && !img.complete) {
    img.onload = print;
  } else {
    setTimeout(print, 150);
  }
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
