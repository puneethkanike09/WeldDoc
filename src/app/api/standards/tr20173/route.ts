import {
  serveStandardPdfFromCandidates,
  standardPath,
} from "@/lib/standards/serve-pdf";
import { TR_20173 } from "@/lib/iso9606/standards-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return serveStandardPdfFromCandidates(
    [
      standardPath("standards", TR_20173.fileName),
      standardPath(TR_20173.fileName),
    ],
    TR_20173.fileName,
  );
}
