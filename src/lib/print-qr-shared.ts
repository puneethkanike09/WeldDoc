const QR_LABEL_INCH = "25.4mm";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wait until every image in the print document has loaded (or timed out). */
export function waitForPrintImages(
  doc: Document,
  onReady: () => void,
  timeoutMs = 20_000,
) {
  const images = Array.from(doc.querySelectorAll("img"));
  if (!images.length) {
    window.setTimeout(onReady, 100);
    return;
  }

  let settled = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.setTimeout(onReady, 50);
  };

  const onImageSettled = () => {
    settled += 1;
    if (settled >= images.length) finish();
  };

  for (const img of images) {
    if (img.complete) {
      onImageSettled();
      continue;
    }
    img.addEventListener("load", onImageSettled, { once: true });
    img.addEventListener("error", onImageSettled, { once: true });
  }

  window.setTimeout(finish, timeoutMs);
}

export function openPrintDocument(html: string, onReady: () => void) {
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

  waitForPrintImages(doc, () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => iframe.remove(), 500);
    onReady();
  });
}

export { QR_LABEL_INCH, escapeHtml };
