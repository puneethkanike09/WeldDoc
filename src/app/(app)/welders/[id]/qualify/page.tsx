import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { ndtJointCategory } from "@/lib/iso9606/qualification-fields";
import {
  savePlan,
  saveTest,
  saveNdt,
  issueCertificate,
  saveLegacy,
} from "./actions";
import {
  Stepper,
  PlanStep,
  TestStep,
  NdtStep,
  CertificateStep,
} from "./wizard";
import { LegacyForm } from "./legacy-form";
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
  searchParams: Promise<{ wpq?: string; step?: string; mode?: string }>;
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

  const legacyMode =
    sp.mode === "legacy" || (!sp.wpq && !welder.is_new_welder && sp.mode !== "new");

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

  return (
    <>
      <PageHeader
        title="Qualification workflow"
        description={`${welder.full_name} · ${welder.uid}`}
      >
        {legacyMode ? (
          <Link
            href={`/welders/${id}/qualify?mode=new`}
            className="text-sm font-medium text-ember hover:underline"
          >
            Switch to initial qualification
          </Link>
        ) : (
          !sp.wpq && (
            <Link
              href={`/welders/${id}/qualify?mode=legacy`}
              className="text-sm font-medium text-ember hover:underline"
            >
              Old data entry (upload PDFs)
            </Link>
          )
        )}
      </PageHeader>

      <div className="px-8 py-8">
        <Link
          href={`/welders/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        {legacyMode ? (
          <LegacyForm action={saveLegacy.bind(null, id)} welder={welder} />
        ) : (
          <>
            <Stepper step={step} wpqId={wpq?.id ?? null} welderId={id} />

            {step === 1 && (
              <PlanStep
                action={savePlan.bind(null, id, wpq?.id ?? null)}
                wpq={wpq}
                orgName={org.name}
                orgLocation={org.location_code}
              />
            )}

            {step === 2 && wpq && (
              <TestStep
                action={saveTest.bind(null, id, wpq.id)}
                welderId={id}
                wpq={wpq}
                rangePreview={range?.summary ?? null}
              />
            )}

            {step === 3 && wpq && (
              <NdtStep
                action={saveNdt.bind(null, id, wpq.id, wpq.joint_type)}
                welderId={id}
                wpqId={wpq.id}
                jointType={ndtJointCategory(wpq.joint_type)}
                existing={ndt}
              />
            )}

            {step === 4 && wpq && (
              <CertificateStep
                action={issueCertificate.bind(null, id, wpq.id)}
                welderId={id}
                wpq={wpq}
                rangeSummary={range?.summary ?? null}
              />
            )}

            {step > 1 && !wpq && (
              <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
                Start at step 1 to create the qualification record first.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
