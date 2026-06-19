import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { processLabel } from "@/lib/iso9606/constants";
import type {
  NdtDtRecord,
  QualificationRecord,
  QualificationTestReport,
  Signatory,
  Welder,
} from "@/types/db";
import { ArrowLeft, Download } from "lucide-react";

export const metadata: Metadata = { title: "Test report" };

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: reportRow } = await supabase
    .from("qualification_test_reports")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!reportRow) notFound();
  const report = reportRow as QualificationTestReport;

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
    .in("id", welderIds.length ? welderIds : ["00000000-0000-0000-0000-000000000000"]);
  const welders = new Map(
    ((welderRows ?? []) as Welder[]).map((w) => [w.id, w]),
  );

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

  const sigIds = [
    report.manufacturer_signatory_id,
    report.examining_body_signatory_id,
  ].filter(Boolean) as string[];
  const { data: sigRows } = await supabase
    .from("signatories")
    .select("*")
    .in("id", sigIds.length ? sigIds : ["00000000-0000-0000-0000-000000000000"]);
  const sigs = new Map(((sigRows ?? []) as Signatory[]).map((s) => [s.id, s]));
  const manufacturer = report.manufacturer_signatory_id
    ? sigs.get(report.manufacturer_signatory_id)
    : null;
  const examiner = report.examining_body_signatory_id
    ? sigs.get(report.examining_body_signatory_id)
    : null;

  const isBW = report.joint_category === "BW";

  return (
    <>
      <PageHeader
        title={report.report_number}
        description={`Welder Qualification Details · ${
          isBW ? "Butt weld" : "Fillet weld"
        } · ${formatDate(report.test_date)}`}
      >
        <ButtonLink href={`/api/reports/${id}/sheet`}>
          <Download className="h-4 w-4" /> Download sheet
        </ButtonLink>
      </PageHeader>

      <div className="px-8 py-8">
        <Link
          href="/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>

        <Card>
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-silver text-[11px] uppercase tracking-wide text-steel">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Welder ID</th>
                  <th className="px-2 py-2">Process</th>
                  <th className="px-2 py-2">Joint / Position</th>
                  <th className="px-2 py-2">Material / Dimensions</th>
                  <th className="px-2 py-2">Visual</th>
                  <th className="px-2 py-2">{isBW ? "RT/UT" : "Fracture"}</th>
                </tr>
              </thead>
              <tbody>
                {wpqs.map((q, i) => {
                  const welder = welders.get(q.welder_id);
                  const ndt = ndtByWpq.get(q.id) ?? [];
                  const visual = ndt.find((n) =>
                    n.test_method.startsWith("Visual"),
                  );
                  const main = ndt.find(
                    (n) =>
                      n.test_method === "RT/UT" ||
                      n.test_method === "Fracture Test",
                  );
                  return (
                    <tr
                      key={q.id}
                      className="border-b border-silver/60 last:border-0"
                    >
                      <td className="px-2 py-2 text-steel">{i + 1}</td>
                      <td className="px-2 py-2">
                        {welder ? (
                          <Link
                            href={`/welders/${welder.id}`}
                            className="font-medium text-onyx hover:text-ember"
                          >
                            {welder.full_name}
                            {welder.is_new_welder ? " *" : ""}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-2 text-charcoal">
                        {welder?.welder_id ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-charcoal">
                        {processLabel(q.process)}
                      </td>
                      <td className="px-2 py-2 text-charcoal">
                        {q.joint_type} / {q.product} - {q.position ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-charcoal">
                        {q.material_grade ?? "—"}
                        {q.dimensions ? ` / ${q.dimensions}` : ""}
                      </td>
                      <td className="px-2 py-2">
                        <Result value={visual?.result} />
                      </td>
                      <td className="px-2 py-2">
                        <Result value={main?.result} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {report.remarks && (
              <p className="mt-4 text-sm text-graphite">
                <span className="font-medium text-onyx">Remarks:</span>{" "}
                {report.remarks}
              </p>
            )}

            <div className="mt-6 grid gap-6 border-t border-silver pt-6 sm:grid-cols-2">
              <SignatoryBlock label="Manufacturer" sig={manufacturer} />
              <SignatoryBlock label="Examining body" sig={examiner} />
            </div>
            <p className="mt-4 text-xs text-steel">NOTE: (*) New welder</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Result({ value }: { value?: string }) {
  if (!value) return <span className="text-steel">—</span>;
  const tone =
    value === "Pass" ? "active" : value === "Fail" ? "expired" : "neutral";
  return <Badge tone={tone}>{value === "Pass" ? "OK" : value}</Badge>;
}

function SignatoryBlock({
  label,
  sig,
}: {
  label: string;
  sig: Signatory | null | undefined;
}) {
  return (
    <div>
      <p className="font-display text-[11px] font-semibold uppercase tracking-wide text-steel">
        {label}
      </p>
      <p className="mt-1 font-medium text-onyx">{sig?.name ?? "—"}</p>
      <p className="text-sm text-graphite">
        {sig
          ? `${sig.designation ?? ""}${
              sig.organisation ? ` · ${sig.organisation}` : ""
            }`
          : "Not assigned"}
      </p>
    </div>
  );
}
