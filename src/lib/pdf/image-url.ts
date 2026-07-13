/**
 * Fetches remote images for @react-pdf/renderer. Invalid or unsupported files
 * (corrupt PNG, WebP, etc.) return null so PDF generation still succeeds.
 */
function isPdfSafeImage(buf: Uint8Array): boolean {
  if (buf.length < 4) return false;
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return true;
  }
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }
  return false;
}

function mimeFor(buf: Uint8Array): string {
  if (buf[0] === 0xff) return "image/jpeg";
  return "image/png";
}

/** Resolve a storage URL to an inline data URL, or null when unusable. */
export async function resolvePdfImageUrl(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url?.trim()) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!isPdfSafeImage(buf)) return null;
    const base64 = Buffer.from(buf).toString("base64");
    return `data:${mimeFor(buf)};base64,${base64}`;
  } catch {
    return null;
  }
}
