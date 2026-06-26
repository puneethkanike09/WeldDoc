import { standardBySlug } from "@/lib/standards/catalog";
import { serveStandardPdf, standardPath } from "@/lib/standards/serve-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const entry = standardBySlug(slug);
  if (!entry) return new Response("Standard not found.", { status: 404 });

  const filePath = standardPath("standards", entry.pdfFileName);
  return serveStandardPdf(filePath, entry.pdfFileName);
}
