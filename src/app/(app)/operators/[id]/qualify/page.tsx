import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { QualifyStepper } from "@/components/qualify/wizard-chrome";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { operatorQualifyMaxStep } from "@/lib/qualify/workflow-step";
import { operatorNdtReady } from "@/lib/iso14732/qualification-fields";
import { canDiscardOq } from "@/lib/operator-status";
import type {
  Operator,
  OperatorNdtRecord,
  OperatorQualification,
  OperatorRange,
} from "@/types/db";
import { ArrowLeft } from "lucide-react";
import {
  discardOq,
  issueOperatorCertificate,
  saveOperatorNdt,
  saveOperatorPlan,
  saveOperatorTestPiece,
} from "./actions";
import { DiscardOqButton } from "../discard-oq-button";
import {
  OperatorCertificateStep,
  OperatorNdtStep,
  OperatorPlanStep,
  OperatorTestStep,
} from "./wizard";

export const metadata: Metadata = { title: "Qualification workflow" };

export default async function OperatorQualifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oq?: string; step?: string }>;
}) {
  const { id } = await params;
  const { oq: oqParam, step: stepParam } = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!operator) notFound();
  const op = operator as Operator;

  let oq: OperatorQualification | null = null;
  if (oqParam) {
    const { data } = await supabase
      .from("operator_qualifications")
      .select("*")
      .eq("id", oqParam)
      .eq("operator_id", id)
      .eq("org_id", org.id)
      .single();
    oq = (data as OperatorQualification | null) ?? null;
  }

  let range: OperatorRange | null = null;
  let ndt: OperatorNdtRecord[] = [];
  if (oq) {
    const [{ data: rangeRow }, { data: ndtRows }] = await Promise.all([
      supabase
        .from("operator_ranges")
        .select("*")
        .eq("oq_id", oq.id)
        .maybeSingle(),
      supabase.from("operator_ndt_records").select("*").eq("oq_id", oq.id),
    ]);
    if (rangeRow) {
      const r = rangeRow as OperatorRange & { range_lines?: unknown };
      range = {
        ...r,
        range_lines: Array.isArray(r.range_lines)
          ? (r.range_lines as string[])
          : [],
      };
    }
    ndt = (ndtRows ?? []) as OperatorNdtRecord[];
  }

  const step = Math.min(4, Math.max(1, parseInt(stepParam ?? "1", 10) || 1));
  const qualifyHref = `/operators/${id}/qualify`;
  const maxStep = operatorQualifyMaxStep(oq, ndt);
  const certReady = oq ? operatorNdtReady(oq, ndt) : false;

  return (
    <>
      <PageHeader
        title="Qualification workflow"
        description={`${op.full_name} · ${op.operator_id ?? "—"}`}
      />
      <div className="page-content">
        <Link
          href={`/operators/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <QualifyStepper
          step={step}
          maxStep={maxStep}
          recordId={oq?.id ?? null}
          qualifyHref={qualifyHref}
        />

        {oq && canDiscardOq(oq.oq_status) && (
          <div className="mb-4 flex justify-end">
            <DiscardOqButton action={discardOq.bind(null, id, oq.id)} />
          </div>
        )}

        {step === 4 && oq && !certReady && (
          <p className="mb-4 rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Add NDT tests on step 3 with Pass results before issuing a
            certificate, or go back to step 3 to update them.
          </p>
        )}

        {step === 1 && (
          <OperatorPlanStep
            action={saveOperatorPlan}
            oq={oq}
            operator={op}
            orgName={org.name}
            orgLocation={org.location_code}
            maxStep={maxStep}
          />
        )}

        {step === 2 && oq && (
          <OperatorTestStep
            action={saveOperatorTestPiece}
            operatorId={id}
            oq={oq}
            rangePreview={range?.summary ?? null}
            maxStep={maxStep}
          />
        )}

        {step === 3 && oq && (
          <OperatorNdtStep
            action={saveOperatorNdt}
            operatorId={id}
            oq={oq}
            ndt={ndt}
            maxStep={maxStep}
          />
        )}

        {step === 4 && oq && (
          <OperatorCertificateStep
            action={issueOperatorCertificate}
            operatorId={id}
            oq={oq}
            rangeSummary={range?.summary ?? null}
            ndtReady={certReady}
          />
        )}

        {step > 1 && !oq && (
          <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Start at step 1 to create the qualification record first.
          </p>
        )}
      </div>
    </>
  );
}
