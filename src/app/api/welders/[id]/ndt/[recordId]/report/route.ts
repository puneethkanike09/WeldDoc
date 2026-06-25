import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serve an uploaded NDT report PDF for in-app viewing. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id: welderId, recordId } = await params;
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
    .from("ndt_dt_records")
    .select("report_pdf_path, wpq_id")
    .eq("id", recordId)
    .eq("org_id", profile.org_id)
    .single();

  if (!record?.report_pdf_path) {
    return new Response("Report not found", { status: 404 });
  }

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("welder_id")
    .eq("id", record.wpq_id)
    .eq("welder_id", welderId)
    .single();

  if (!wpq) return new Response("Not found", { status: 404 });

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
