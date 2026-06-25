import { serveStandardPdf, standardPath } from "@/lib/standards/serve-pdf";
import { ISO_9606_1 } from "@/lib/iso9606/standards-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return serveStandardPdf(
    standardPath("standards", ISO_9606_1.fileName),
    ISO_9606_1.fileName,
  );
}
