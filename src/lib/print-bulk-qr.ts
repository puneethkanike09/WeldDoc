import type { QrPrintColor } from "@/lib/qr";
import { qrImageUrl } from "@/lib/qr";
import {
  escapeHtml,
  openPrintDocument,
  QR_LABEL_INCH,
} from "@/lib/print-qr-shared";

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
        <img src="${origin}${qrImageUrl(e.qrToken, "black")}" alt="" />
        <p class="id">${escapeHtml(e.plantWelderId)}</p>
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<style>
  @page { margin: 8mm; }
  body { font-family: system-ui, sans-serif; margin: 0; }
  .grid { display: flex; flex-wrap: wrap; gap: 4mm; }
  .cell { width: ${QR_LABEL_INCH}; text-align: center; page-break-inside: avoid; }
  .cell img { width: ${QR_LABEL_INCH}; height: ${QR_LABEL_INCH}; display: block; }
  .id { font-size: 6pt; font-weight: 700; margin: 1mm 0 0; word-break: break-all; }
</style></head><body><div class="grid">${cells}</div></body></html>`;

  openPrintDocument(html, () => {});
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
