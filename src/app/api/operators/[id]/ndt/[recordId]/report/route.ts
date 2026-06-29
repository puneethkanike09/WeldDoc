import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id: operatorId, recordId } = await params;
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

  const { data: record } = await supabase
    .from("operator_ndt_records")
    .select("report_pdf_path, oq_id")
    .eq("id", recordId)
    .eq("org_id", profile.org_id)
    .single();

  if (!record?.report_pdf_path) {
    return new Response("Report not found", { status: 404 });
  }

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("operator_id")
    .eq("id", record.oq_id)
    .eq("operator_id", operatorId)
    .single();

  if (!oq) return new Response("Not found", { status: 404 });

  const url = await resolveUrl("ndt-reports", record.report_pdf_path);
  if (!url) return new Response("Report unavailable", { status: 404 });

  const upstream = await fetch(url);
  if (!upstream.ok) return new Response("Report unavailable", { status: 502 });

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/pdf",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
