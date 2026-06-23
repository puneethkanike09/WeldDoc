import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import {
  ReportSheetDocument,
  type SheetData,
  type SheetRow,
} from "@/lib/pdf/report-sheet";
import type {
  NdtDtRecord,
  Organization,
  QualificationRecord,
  QualificationTestReport,
  Welder,
} from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const [{ data: org }, { data: report }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase
      .from("qualification_test_reports")
      .select("*")
      .eq("id", id)
      .eq("org_id", profile.org_id)
      .single(),
  ]);
  if (!org || !report) return new Response("Not found", { status: 404 });

  const { data: wpqRows } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("report_id", id)
    .order("created_at");
  const wpqs = (wpqRows ?? []) as QualificationRecord[];

  const welderIds = wpqs.map((w) => w.welder_id);
  const { data: welderRows } = await supabase
    .from("welders")
    .select("*")
    .in(
      "id",
      welderIds.length ? welderIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const welders = new Map(((welderRows ?? []) as Welder[]).map((w) => [w.id, w]));

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("*")
    .in(
      "wpq_id",
      wpqs.length ? wpqs.map((w) => w.id) : ["00000000-0000-0000-0000-000000000000"],
    );
  const ndtByWpq = new Map<string, NdtDtRecord[]>();
  for (const n of (ndtRows ?? []) as NdtDtRecord[]) {
    const arr = ndtByWpq.get(n.wpq_id) ?? [];
    arr.push(n);
    ndtByWpq.set(n.wpq_id, arr);
  }

  const rows: SheetRow[] = wpqs.map((q) => {
    const welder = welders.get(q.welder_id);
    const ndt = ndtByWpq.get(q.id) ?? [];
    return {
      name: welder?.full_name ?? "—",
      welderId: welder?.welder_id ?? null,
      isNew: welder?.is_new_welder ?? false,
      process: q.process,
      joint: q.joint_type,
      product: q.product,
      position: q.position,
      material: q.material_grade,
      dimensions: q.dimensions,
      wps: q.wps_reference,
      visual:
        ndt.find((n) => n.test_method.startsWith("Visual"))?.result ?? null,
      main:
        ndt.find(
          (n) => n.test_method === "RT/UT" || n.test_method === "Fracture Test",
        )?.result ?? null,
    };
  });

  const r = report as QualificationTestReport;

  const data: SheetData = {
    org: org as Organization,
    report: r,
    rows,
  };

  const buffer = await renderToBuffer(<ReportSheetDocument data={data} />);

  const path = `${profile.org_id}/reports/${r.report_number.replace(/[^\w-]/g, "_")}.pdf`;
  await supabase.storage
    .from("generated-pdfs")
    .upload(path, buffer, { contentType: "application/pdf", upsert: true });
  await supabase
    .from("qualification_test_reports")
    .update({ sheet_pdf_path: path })
    .eq("id", id);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${r.report_number.replace(/[^\w-]/g, "_")}.pdf"`,
    },
  });
}
