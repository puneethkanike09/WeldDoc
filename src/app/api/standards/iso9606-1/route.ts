import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { ISO_9606_1 } from "@/lib/iso9606/standards-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const filePath = path.join(process.cwd(), "standards", ISO_9606_1.fileName);
  let pdf: Buffer;
  try {
    pdf = await readFile(filePath);
  } catch {
    return new Response("Standard PDF not found.", { status: 404 });
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${ISO_9606_1.fileName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
