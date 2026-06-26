import { standardBySlug } from "@/lib/standards/catalog";
import { serveStandardPdf, standardPath } from "@/lib/standards/serve-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Backward-compatible alias — also served via /api/standards/[slug]. */
export async function GET() {
  const entry = standardBySlug("iso9606-1");
  if (!entry) return new Response("Standard not found.", { status: 404 });
  return serveStandardPdf(
    standardPath("standards", entry.pdfFileName),
    entry.pdfFileName,
  );
}
