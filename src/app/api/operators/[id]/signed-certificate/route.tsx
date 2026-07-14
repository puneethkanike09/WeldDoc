import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadObject } from "@/lib/storage";
import type { OperatorQualification } from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const oqId = request.nextUrl.searchParams.get("oq");
  if (!oqId) return new Response("Missing oq", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile) return new Response("Unauthorized", { status: 401 });

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("signed_certificate_pdf_path, operator_id, oq_status")
    .eq("id", oqId)
    .eq("operator_id", id)
    .eq("org_id", profile.org_id)
    .single();

  if (!oq) return new Response("Not found", { status: 404 });

  const q = oq as Pick<
    OperatorQualification,
    "signed_certificate_pdf_path" | "operator_id" | "oq_status"
  >;

  if (q.oq_status !== "Approved" || !q.signed_certificate_pdf_path) {
    return new Response("Signed certificate not found", { status: 404 });
  }

  let body: Buffer;
  let contentType: string | null;
  try {
    const downloaded = await downloadObject(
      "generated-pdfs",
      q.signed_certificate_pdf_path,
    );
    body = downloaded.body;
    contentType = downloaded.contentType;
  } catch {
    return new Response("File not found", { status: 404 });
  }

  const ext = q.signed_certificate_pdf_path.split(".").pop()?.toLowerCase();
  const resolvedType =
    contentType ||
    (ext === "pdf"
      ? "application/pdf"
      : ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "webp"
            ? "image/webp"
            : "application/octet-stream");

  const download = request.nextUrl.searchParams.get("download") === "1";

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": resolvedType,
      "Content-Disposition": `${
        download ? "attachment" : "inline"
      }; filename="signed-certificate-${oqId}.${ext ?? "pdf"}"`,
    },
  });
}
