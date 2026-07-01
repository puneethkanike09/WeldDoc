import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { GroupSessionStepper } from "@/components/qualify/wizard-chrome";
import { GroupWelderCertificateStep } from "@/components/qualify/group-certificate-panel";
import { GroupWelderNdtStep } from "@/components/qualify/group-welder-ndt-step";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
import { loadSession } from "@/lib/qualify/group-session";
import {
  welderJointLabelFromPlan,
  welderRecordFromSession,
} from "@/lib/qualify/group-session/welder";
import { wpqReadyForCertificate } from "@/lib/iso9606/qualification-fields";
import type {
  NdtDtRecord,
  QualificationRecord,
  QualificationSession,
  QualificationSessionMember,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { ArrowLeft } from "lucide-react";
import {
  issueWelderGroupMemberCertificate,
  saveWelderGroupNdt,
  saveWelderGroupPlan,
  saveWelderGroupTestPiece,
} from "../actions";
import { PlanStep, TestStep } from "@/app/(app)/welders/[id]/qualify/wizard";
import { groupSessionDraftKey } from "@/lib/qualify/wizard-draft";

export const metadata: Metadata = { title: "Group qualification" };

export default async function WelderGroupSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  await requireWelderWorkspace();
  const { sessionId } = await params;
  const { step: stepParam } = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_9606_1");
  if (!loaded) notFound();

  const { session, members } = loaded;
  const step = Math.min(4, Math.max(1, parseInt(stepParam ?? "1", 10) || 1));
  const baseHref = `/welders/qualify/group/${sessionId}`;
  const activeMembers = members.filter((m) => m.member_status !== "Removed");
  if (activeMembers.length === 0) notFound();

  const firstMember = activeMembers[0];
  const draftWelderId = `group-${sessionId}`;

  const welderIds = activeMembers
    .map((m) => m.welder_id)
    .filter(Boolean) as string[];

  const { data: welderRows } = await supabase
    .from("welders")
    .select("*")
    .in("id", welderIds.length ? welderIds : ["00000000-0000-0000-0000-000000000000"]);
  const welders = new Map(((welderRows ?? []) as Welder[]).map((w) => [w.id, w]));

  let templateWpq: QualificationRecord | null = null;
  let rangePreview: string | null = null;

  if (firstMember?.qualification_id) {
    const { data: wpqRow } = await supabase
      .from("qualification_records")
      .select("*")
      .eq("id", firstMember.qualification_id)
      .single();
    if (wpqRow) {
      templateWpq = wpqRow as QualificationRecord;
      const { data: rangeRow } = await supabase
        .from("ranges_of_approval")
        .select("summary")
        .eq("wpq_id", templateWpq.id)
        .maybeSingle();
      rangePreview = (rangeRow as RangeOfApproval | null)?.summary ?? null;
    }
  }

  const wpqTemplate = welderRecordFromSession(
    session.shared_plan,
    session.shared_test_piece,
    templateWpq,
  );

  const jointLabel = welderJointLabelFromPlan(session.shared_plan);
  const defaultMethods = Array.isArray(
    (session.shared_ndt as { selected_methods?: string[] }).selected_methods,
  )
    ? (session.shared_ndt as { selected_methods: string[] }).selected_methods
    : undefined;

  const qualIds = activeMembers
    .map((m) => m.qualification_id)
    .filter(Boolean) as string[];

  const [{ data: wpqRows }, { data: rangeRows }, { data: ndtRows }] =
    await Promise.all([
      qualIds.length
        ? supabase.from("qualification_records").select("*").in("id", qualIds)
        : Promise.resolve({ data: [] }),
      qualIds.length
        ? supabase.from("ranges_of_approval").select("*").in("wpq_id", qualIds)
        : Promise.resolve({ data: [] }),
      qualIds.length
        ? supabase.from("ndt_dt_records").select("*").in("wpq_id", qualIds)
        : Promise.resolve({ data: [] }),
    ]);

  const wpqMap = new Map(
    ((wpqRows ?? []) as QualificationRecord[]).map((q) => [q.id, q]),
  );
  const rangeMap = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );
  const ndtByWpq = new Map<string, NdtDtRecord[]>();
  for (const n of (ndtRows ?? []) as NdtDtRecord[]) {
    const arr = ndtByWpq.get(n.wpq_id) ?? [];
    arr.push(n);
    ndtByWpq.set(n.wpq_id, arr);
  }

  const ndtMembers = activeMembers
    .filter((m) => m.welder_id && m.qualification_id)
    .map((m) => {
      const w = welders.get(m.welder_id!);
      return {
        memberId: m.id,
        personName: w?.full_name ?? "—",
        plantId: w?.welder_id ?? null,
        welderId: m.welder_id!,
        existingNdt: ndtByWpq.get(m.qualification_id!) ?? [],
      };
    });

  const certMembers = activeMembers
    .filter((m) => m.welder_id && m.qualification_id)
    .map((m) => {
      const w = welders.get(m.welder_id!);
      const q = wpqMap.get(m.qualification_id!);
      const range = rangeMap.get(m.qualification_id!);
      const ndt = ndtByWpq.get(m.qualification_id!) ?? [];
      return {
        memberId: m.id,
        personId: m.welder_id!,
        personName: w?.full_name ?? "—",
        plantId: w?.welder_id ?? null,
        memberStatus: m.member_status,
        rangeSummary: range?.summary ?? null,
        profileHref: `/welders/${m.welder_id}`,
        ndtReady: q
          ? wpqReadyForCertificate(
              q,
              ndt.map((r) => ({
                test_method: r.test_method,
                result: r.result,
              })),
            )
          : false,
        defaultExaminerName: q?.examiner_name ?? null,
        defaultCertDate: q?.date_of_welding ?? null,
        defaultJobKnowledge: q?.job_knowledge ?? "",
        supplementaryFillet: q?.supplementary_fillet ?? false,
      };
    });

  return (
    <>
      <PageHeader
        title={session.label ?? "Group qualification"}
        description={`${activeMembers.length} welder(s) · shared ISO 9606-1 session`}
      />
      <div className="px-8 py-8">
        <Link
          href="/welders/qualify/group"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>

        <GroupSessionStepper step={step} baseHref={baseHref} />

        {step === 1 && (
          <PlanStep
            action={saveWelderGroupPlan.bind(null, sessionId)}
            wpq={wpqTemplate}
            orgName={org.name}
            orgLocation={org.location_code}
            welderId={draftWelderId}
            draftStorageKeyOverride={groupSessionDraftKey(sessionId, 1)}
          />
        )}

        {step === 2 && templateWpq && (
          <TestStep
            action={saveWelderGroupTestPiece.bind(null, sessionId)}
            welderId={draftWelderId}
            wpq={
              wpqTemplate.id !== "session-template" ? wpqTemplate : templateWpq
            }
            rangePreview={rangePreview}
            draftStorageKeyOverride={groupSessionDraftKey(sessionId, 2)}
          />
        )}

        {step === 2 && !templateWpq && (
          <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Complete step 1 first.
          </p>
        )}

        {step === 3 && (
          <GroupWelderNdtStep
            action={saveWelderGroupNdt.bind(null, sessionId)}
            baseHref={baseHref}
            jointLabel={jointLabel}
            members={ndtMembers}
            defaultMethods={defaultMethods}
          />
        )}

        {step === 4 && (
          <GroupWelderCertificateStep
            issueAction={issueWelderGroupMemberCertificate.bind(null, sessionId)}
            baseHref={baseHref}
            members={certMembers}
          />
        )}
      </div>
    </>
  );
}
