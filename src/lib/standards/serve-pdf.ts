import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";

export async function serveStandardPdf(
  filePath: string,
  downloadName: string,
): Promise<Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let pdf: Buffer;
  try {
    pdf = await readFile(filePath);
  } catch {
    return new Response("Standard PDF not found.", { status: 404 });
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${downloadName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export function standardPath(...segments: string[]): string {
  return path.join(process.cwd(), ...segments);
}

export async function serveStandardPdfFromCandidates(
  candidates: string[],
  downloadName: string,
): Promise<Response> {
  for (const filePath of candidates) {
    try {
      await access(filePath);
      return serveStandardPdf(filePath, downloadName);
    } catch {
      continue;
    }
  }
  return new Response("Standard PDF not found.", { status: 404 });
}
