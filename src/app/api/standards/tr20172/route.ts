import {
  serveStandardPdfFromCandidates,
  standardPath,
} from "@/lib/standards/serve-pdf";
import { TR_20172 } from "@/lib/iso9606/standards-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return serveStandardPdfFromCandidates(
    [
      standardPath("standards", TR_20172.fileName),
      standardPath(TR_20172.fileName),
      standardPath("CEN-ISO-TR-20172-2021-en (1).pdf"),
      standardPath("CEN-ISO-TR-20172-2021-en.pdf"),
    ],
    TR_20172.fileName,
  );
}
