import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  ndtJointCategory,
  wpqReadyForCertificate,
} from "@/lib/iso9606/qualification-fields";
import { welderQualifyMaxStep } from "@/lib/qualify/workflow-step";
import { effectiveRangeForWpq } from "@/lib/iso9606/effective-range";
import {
  savePlan,
  saveTest,
  saveNdt,
  issueCertificate,
} from "./actions";
import {
  Stepper,
  PlanStep,
  TestStep,
  NdtStep,
  CertificateStep,
} from "./wizard";
import type {
  NdtDtRecord,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Qualification workflow" };

export default async function QualifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wpq?: string; step?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welderRow } = await supabase
    .from("welders")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  if (!welderRow) notFound();
  const welder = welderRow as Welder;

  let wpq: QualificationRecord | null = null;
  let ndt: NdtDtRecord[] = [];
  let range: RangeOfApproval | null = null;

  if (sp.wpq) {
    const { data } = await supabase
      .from("qualification_records")
      .select("*")
      .eq("id", sp.wpq)
      .eq("org_id", org.id)
      .single();
    wpq = (data as QualificationRecord) ?? null;
    if (wpq) {
      const [{ data: n }, { data: r }] = await Promise.all([
        supabase.from("ndt_dt_records").select("*").eq("wpq_id", wpq.id),
        supabase
          .from("ranges_of_approval")
          .select("*")
          .eq("wpq_id", wpq.id)
          .maybeSingle(),
      ]);
      ndt = (n ?? []) as NdtDtRecord[];
      range = (r as RangeOfApproval) ?? null;
    }
  }

  const step = Math.min(Math.max(Number(sp.step) || 1, 1), 4);
  const maxStep = welderQualifyMaxStep(wpq, ndt);
  const certReady = wpq ? wpqReadyForCertificate(wpq, ndt) : false;
  const rangeSummary = wpq
    ? (effectiveRangeForWpq(wpq, range).summary ?? null)
    : null;

  return (
    <>
      <PageHeader
        title="Qualification workflow"
        description={`${welder.full_name} · ${welder.welder_id ?? "—"}`}
      />

      <div className="page-content">
        <Link
          href={`/welders/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <Stepper
          step={step}
          maxStep={maxStep}
          wpqId={wpq?.id ?? null}
          welderId={id}
        />

        {step === 4 && wpq && !certReady && (
          <p className="mb-4 rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Add NDT tests on step 3 with Pass results before issuing a
            certificate, or go back to step 3 to update them.
          </p>
        )}

        {step === 1 && (
          <PlanStep
            action={savePlan.bind(null, id, wpq?.id ?? null)}
            wpq={wpq}
            orgName={org.name}
            orgLocation={org.location_code}
            welderId={id}
            maxStep={maxStep}
          />
        )}

        {step === 2 && wpq && (
          <TestStep
            action={saveTest.bind(null, id, wpq.id)}
            welderId={id}
            wpq={wpq}
            rangePreview={rangeSummary}
            maxStep={maxStep}
          />
        )}

        {step === 3 && wpq && (
          <NdtStep
            action={saveNdt.bind(null, id, wpq.id, wpq.joint_type)}
            welderId={id}
            wpqId={wpq.id}
            jointType={ndtJointCategory(wpq.joint_type)}
            existing={ndt}
            maxStep={maxStep}
          />
        )}

        {step === 4 && wpq && (
          <CertificateStep
            action={issueCertificate.bind(null, id, wpq.id)}
            welderId={id}
            wpq={wpq}
            rangeSummary={rangeSummary}
            ndtReady={certReady}
          />
        )}

        {step > 1 && !wpq && (
          <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Start at step 1 to create the qualification record first.
          </p>
        )}
      </div>
    </>
  );
}
