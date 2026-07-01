import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { GroupSessionStepper } from "@/components/qualify/wizard-chrome";
import { GroupOperatorCertificateStep } from "@/components/qualify/group-certificate-panel";
import { GroupOperatorNdtStep } from "@/components/qualify/group-operator-ndt-step";
import { GroupSessionParticipants } from "@/components/qualify/group-session-participants";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireOperatorWorkspace } from "@/lib/standards/active-standard.server";
import {
  ensureMembersMaterialized,
  loadSession,
} from "@/lib/qualify/group-session";
import { operatorRecordFromSession } from "@/lib/qualify/group-session/operator";
import { operatorNdtReady } from "@/lib/iso14732/qualification-fields";
import type {
  Operator,
  OperatorNdtRecord,
  OperatorQualification,
  QualificationSession,
} from "@/types/db";
import { ArrowLeft } from "lucide-react";
import {
  issueOperatorGroupMemberCertificate,
  saveOperatorGroupNdt,
  saveOperatorGroupPlan,
  saveOperatorGroupTestPiece,
} from "../actions";
import {
  OperatorPlanStep,
  OperatorTestStep,
} from "@/app/(app)/operators/[id]/qualify/wizard";
import { groupSessionDraftKey } from "@/lib/qualify/wizard-draft";

export const metadata: Metadata = { title: "Group qualification" };

export default async function OperatorGroupSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  await requireOperatorWorkspace();
  const { sessionId } = await params;
  const { step: stepParam } = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_14732");
  if (!loaded) notFound();

  let { session, members } = loaded;
  members = await ensureMembersMaterialized(supabase, org.id, session, members);

  const { data: sessionRow } = await supabase
    .from("qualification_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("org_id", org.id)
    .single();
  if (sessionRow) session = sessionRow as QualificationSession;
  const step = Math.min(4, Math.max(1, parseInt(stepParam ?? "1", 10) || 1));
  const baseHref = `/operators/qualify/group/${sessionId}`;
  const activeMembers = members.filter((m) => m.member_status !== "Removed");
  if (activeMembers.length === 0) notFound();

  const firstMember = activeMembers[0];

  const operatorIds = activeMembers
    .map((m) => m.operator_id)
    .filter(Boolean) as string[];

  const { data: operatorRows } = await supabase
    .from("operators")
    .select("*")
    .in(
      "id",
      operatorIds.length ? operatorIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const operators = new Map(
    ((operatorRows ?? []) as Operator[]).map((o) => [o.id, o]),
  );

  let templateOq: OperatorQualification | null = null;
  let rangePreview: string | null = null;

  if (firstMember?.qualification_id) {
    const { data: oqRow } = await supabase
      .from("operator_qualifications")
      .select("*")
      .eq("id", firstMember.qualification_id)
      .single();
    if (oqRow) {
      templateOq = oqRow as OperatorQualification;
      const { data: rangeRow } = await supabase
        .from("operator_ranges")
        .select("summary")
        .eq("oq_id", templateOq.id)
        .maybeSingle();
      rangePreview = (rangeRow as { summary: string | null } | null)?.summary ?? null;
    }
  }

  const oqTemplate = operatorRecordFromSession(
    session.shared_plan,
    session.shared_test_piece,
    templateOq,
  );

  const firstOperator = firstMember?.operator_id
    ? operators.get(firstMember.operator_id)
    : null;

  const sharedNdt = session.shared_ndt as {
    qualification_test_method?: string;
    method1_standard?: string;
  };

  const qualIds = activeMembers
    .map((m) => m.qualification_id)
    .filter(Boolean) as string[];

  const [{ data: oqRows }, { data: rangeRows }, { data: ndtRows }] =
    await Promise.all([
      qualIds.length
        ? supabase.from("operator_qualifications").select("*").in("id", qualIds)
        : Promise.resolve({ data: [] }),
      qualIds.length
        ? supabase.from("operator_ranges").select("*").in("oq_id", qualIds)
        : Promise.resolve({ data: [] }),
      qualIds.length
        ? supabase.from("operator_ndt_records").select("*").in("oq_id", qualIds)
        : Promise.resolve({ data: [] }),
    ]);

  const oqMap = new Map(
    ((oqRows ?? []) as OperatorQualification[]).map((q) => [q.id, q]),
  );
  const rangeMap = new Map(
    ((rangeRows ?? []) as { oq_id: string; summary: string | null }[]).map(
      (r) => [r.oq_id, r],
    ),
  );
  const ndtByOq = new Map<string, OperatorNdtRecord[]>();
  for (const n of (ndtRows ?? []) as OperatorNdtRecord[]) {
    const arr = ndtByOq.get(n.oq_id) ?? [];
    arr.push(n);
    ndtByOq.set(n.oq_id, arr);
  }

  const ndtMembers = activeMembers
    .filter((m) => m.operator_id)
    .map((m) => {
      const o = operators.get(m.operator_id!);
      return {
        memberId: m.id,
        personName: o?.full_name ?? "—",
        plantId: o?.operator_id ?? null,
        operatorId: m.operator_id!,
        qualificationId: m.qualification_id,
        existingNdt: m.qualification_id
          ? (ndtByOq.get(m.qualification_id) ?? [])
          : [],
      };
    });

  const certMembers = activeMembers
    .filter((m) => m.operator_id)
    .map((m) => {
      const o = operators.get(m.operator_id!);
      const q = m.qualification_id ? oqMap.get(m.qualification_id) : null;
      const range = m.qualification_id ? rangeMap.get(m.qualification_id) : null;
      const ndt = m.qualification_id ? (ndtByOq.get(m.qualification_id) ?? []) : [];
      return {
        memberId: m.id,
        personId: m.operator_id!,
        personName: o?.full_name ?? "—",
        plantId: o?.operator_id ?? null,
        memberStatus: m.member_status,
        qualificationId: m.qualification_id,
        rangeSummary: range?.summary ?? null,
        profileHref: `/operators/${m.operator_id}`,
        ndtReady: q ? operatorNdtReady(q, ndt) : false,
        defaultExaminerName: q?.examiner_name ?? null,
        defaultCertDate: q?.date_of_welding ?? null,
      };
    });

  const participantStrip = activeMembers
    .filter((m) => m.operator_id)
    .map((m) => {
      const o = operators.get(m.operator_id!);
      return {
        id: m.id,
        name: o?.full_name ?? "—",
        plantId: o?.operator_id ?? null,
        hasQualification: Boolean(m.qualification_id),
        status: m.member_status,
      };
    });

  return (
    <>
      <PageHeader
        title={session.label ?? "Group qualification"}
        description={`${activeMembers.length} operator(s) · shared ISO 14732 session`}
      />
      <div className="px-8 py-8">
        <Link
          href="/operators/qualify/group"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>

        <GroupSessionStepper step={step} baseHref={baseHref} />

        <GroupSessionParticipants participants={participantStrip} />

        {step === 1 && firstOperator && (
          <OperatorPlanStep
            action={saveOperatorGroupPlan.bind(null, sessionId)}
            oq={oqTemplate}
            operator={firstOperator}
            orgName={org.name}
            orgLocation={org.location_code}
            draftStorageKeyOverride={groupSessionDraftKey(sessionId, 1)}
          />
        )}

        {step === 1 && !firstOperator && (
          <p className="text-sm text-graphite">No participants on this session.</p>
        )}

        {step === 2 && templateOq && firstMember.operator_id && (
          <OperatorTestStep
            action={saveOperatorGroupTestPiece.bind(null, sessionId)}
            operatorId={firstMember.operator_id}
            oq={templateOq}
            rangePreview={rangePreview}
            draftStorageKeyOverride={groupSessionDraftKey(sessionId, 2)}
          />
        )}

        {step === 2 && !templateOq && (
          <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
            Complete step 1 first.
          </p>
        )}

        {step === 3 && (
          <GroupOperatorNdtStep
            action={saveOperatorGroupNdt.bind(null, sessionId)}
            baseHref={baseHref}
            planContext={oqTemplate}
            members={ndtMembers}
            defaultMethod={sharedNdt.qualification_test_method}
            defaultMethod1Standard={sharedNdt.method1_standard}
          />
        )}

        {step === 4 && (
          <GroupOperatorCertificateStep
            issueAction={issueOperatorGroupMemberCertificate.bind(null, sessionId)}
            baseHref={baseHref}
            members={certMembers}
          />
        )}
      </div>
    </>
  );
}
