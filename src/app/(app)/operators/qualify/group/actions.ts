"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { requireWritableSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { computeOperatorExpiry } from "@/lib/iso14732/expiry";
import { recomputeOperatorRange } from "@/lib/iso14732/recompute-operator-range";
import { requiredNdtTests } from "@/lib/iso14732/constants";
import {
  operatorNdtReady,
  validateOperatorCertificateIssue,
  validateOperatorNdtFields,
  validateOperatorPlan,
  validateOperatorTestPiece,
} from "@/lib/iso14732/qualification-fields";
import { requireOperatorWorkspace } from "@/lib/standards/active-standard.server";
import {
  formDataToSnapshot,
  formStr,
  snapshotStr,
} from "@/lib/qualify/group-session/form-helpers";
import {
  loadSession,
  materializeSessionMembers,
  reloadSessionMembers,
  sessionHasApprovedMember,
} from "@/lib/qualify/group-session";
import { deleteGroupSession } from "@/lib/qualify/group-session/delete";
import {
  formatGroupSessionLabel,
  syncGroupSessionLabel,
} from "@/lib/qualify/group-session/label";
import { createOperatorRecord } from "@/lib/operators/create-record";
import {
  parseNewPersonPrefixes,
  sliceNewPersonFormData,
} from "@/lib/qualify/group-session/participant-form";
import type {
  OperatorNdtRecord,
  OperatorQualification,
  OperatorWeldingMode,
  QualificationSessionMember,
  TestResult,
} from "@/types/db";

function parseIds(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

async function getOperatorSessionOrThrow(sessionId: string) {
  await requireOperatorWorkspace();
  const { org } = await requireWritableSession();
  const supabase = await createClient();
  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_14732");
  if (!loaded) throw new Error("Session not found.");
  return { org, supabase, ...loaded };
}

export async function createOperatorGroupSession(formData: FormData) {
  await requireOperatorWorkspace();
  const { org, userId } = await requireWritableSession();
  const supabase = await createClient();

  const existingIds = parseIds(formData, "existing_ids");
  const prefixes = parseNewPersonPrefixes(formData);
  const expectedCount = Number.parseInt(
    formStr(formData.get("participant_count")) ?? "",
    10,
  );
  const createdOperatorIds: string[] = [];
  const allPersonIds = [...existingIds];
  let sessionId: string | null = null;

  try {
    for (const prefix of prefixes) {
      const slice = sliceNewPersonFormData(formData, prefix, "operator_id");
      const id = await createOperatorRecord(supabase, { org, userId }, slice);
      createdOperatorIds.push(id);
      allPersonIds.push(id);
    }

    if (allPersonIds.length === 0) {
      throw new Error("Select or add at least one operator.");
    }

    if (
      Number.isFinite(expectedCount) &&
      expectedCount > 0 &&
      allPersonIds.length !== expectedCount
    ) {
      throw new Error(
        `Could not register all ${expectedCount} participants. Only ${allPersonIds.length} were saved — check new operator details and try again.`,
      );
    }

    const { data: session, error: sessionErr } = await supabase
      .from("qualification_sessions")
      .insert({
        org_id: org.id,
        standard: "ISO_14732",
        created_by: userId,
      })
      .select("id")
      .single();
    if (sessionErr) throw new Error(sessionErr.message);
    sessionId = session.id;

    const memberRows = allPersonIds.map((operatorId) => ({
      session_id: session.id,
      org_id: org.id,
      operator_id: operatorId,
    }));

    const { error: memberErr } = await supabase
      .from("qualification_session_members")
      .insert(memberRows);
    if (memberErr) throw new Error(memberErr.message);

    const { data: operatorRows } = await supabase
      .from("operators")
      .select("operator_id")
      .in("id", allPersonIds);
    const label = formatGroupSessionLabel(
      null,
      (operatorRows ?? []).map(
        (row) => (row as { operator_id: string | null }).operator_id,
      ),
      "operator",
    );
    if (label) {
      await supabase
        .from("qualification_sessions")
        .update({ label })
        .eq("id", session.id);
    }

    revalidatePath("/operators");
    revalidatePath("/operators/qualify/group");
    redirect(`/operators/qualify/group/${session.id}?step=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (sessionId) {
      await supabase.from("qualification_sessions").delete().eq("id", sessionId);
    }
    for (const id of createdOperatorIds) {
      await supabase.from("operators").delete().eq("id", id);
    }
    throw err;
  }
}

export async function saveOperatorGroupPlan(sessionId: string, formData: FormData) {
  validateOperatorPlan(formData);
  const { org, supabase, session, members } =
    await getOperatorSessionOrThrow(sessionId);

  if (sessionHasApprovedMember(members)) {
    throw new Error("Cannot edit plan after a certificate has been issued.");
  }

  const sharedPlan = formDataToSnapshot(formData);
  await supabase
    .from("qualification_sessions")
    .update({ shared_plan: sharedPlan, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("org_id", org.id);

  const freshMembers = await reloadSessionMembers(supabase, org.id, sessionId);
  await materializeSessionMembers(supabase, org.id, {
    ...session,
    shared_plan: sharedPlan,
  }, freshMembers);

  await syncGroupSessionLabel(
    supabase,
    org.id,
    sessionId,
    { ...session, shared_plan: sharedPlan },
    freshMembers,
    "operator",
  );

  revalidatePath(`/operators/qualify/group/${sessionId}`);
  redirect(`/operators/qualify/group/${sessionId}?step=2`);
}

export async function saveOperatorGroupTestPiece(
  sessionId: string,
  formData: FormData,
) {
  const { org, supabase, session, members } =
    await getOperatorSessionOrThrow(sessionId);

  if (sessionHasApprovedMember(members)) {
    throw new Error("Cannot edit test piece after a certificate has been issued.");
  }

  const mode = snapshotStr(session.shared_plan, "welding_mode") as
    | OperatorWeldingMode
    | null;
  validateOperatorTestPiece(formData, mode);

  const sharedTestPiece = formDataToSnapshot(formData);
  await supabase
    .from("qualification_sessions")
    .update({
      shared_test_piece: sharedTestPiece,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("org_id", org.id);

  const freshMembers = await reloadSessionMembers(supabase, org.id, sessionId);
  await materializeSessionMembers(
    supabase,
    org.id,
    { ...session, shared_test_piece: sharedTestPiece },
    freshMembers,
  );

  revalidatePath(`/operators/qualify/group/${sessionId}`);
  redirect(`/operators/qualify/group/${sessionId}?step=3`);
}

async function saveOperatorMemberNdt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  member: QualificationSessionMember,
  method: string,
  method1Standard: string | null,
  formData: FormData,
  oq: OperatorQualification,
) {
  const qualId = member.qualification_id;
  if (!qualId || !member.operator_id) return;

  const tests = requiredNdtTests({
    ...oq,
    qualification_test_method:
      method as OperatorQualification["qualification_test_method"],
    method1_standard: method1Standard,
  });

  const probe = new FormData();
  probe.set("qualification_test_method", method);
  if (method1Standard) probe.set("method1_standard", method1Standard);
  for (const t of tests) {
    const result = formStr(formData.get(`member_${member.id}_ndt_${t.method}`));
    if (result) probe.set(`ndt_${t.method}`, result);
    const date = formStr(
      formData.get(`member_${member.id}_test_date__${t.method}`),
    );
    if (date) probe.set(`test_date__${t.method}`, date);
    const ref = formStr(
      formData.get(`member_${member.id}_conducted_by__${t.method}`),
    );
    if (ref) probe.set(`conducted_by__${t.method}`, ref);
  }
  validateOperatorNdtFields(probe, {
    ...oq,
    qualification_test_method:
      method as OperatorQualification["qualification_test_method"],
    method1_standard: method1Standard,
  });

  const { data: existingNdt } = await supabase
    .from("operator_ndt_records")
    .select("test_method, report_pdf_path")
    .eq("oq_id", qualId);
  const existingByMethod = new Map(
    (existingNdt ?? []).map((r) => [
      r.test_method,
      r.report_pdf_path as string | null,
    ]),
  );

  await supabase.from("operator_ndt_records").delete().eq("oq_id", qualId);

  let anyFail = false;
  let allRequiredPass = tests.length > 0;
  const ndtSnapshot: Record<string, string> = {};

  for (const t of tests) {
    const result = (formStr(
      formData.get(`member_${member.id}_ndt_${t.method}`),
    ) ?? "Pass") as TestResult;
    const conductedBy = formStr(
      formData.get(`member_${member.id}_conducted_by__${t.method}`),
    );
    const testDate = formStr(
      formData.get(`member_${member.id}_test_date__${t.method}`),
    );
    const file = formData.get(`member_${member.id}_report__${t.method}`);
    const uploaded = await uploadFile(
      "ndt-reports",
      file instanceof File && file.size > 0 ? file : null,
      `${orgId}/oq-${qualId}`,
    );
    const reportPath = uploaded ?? existingByMethod.get(t.method) ?? null;

    ndtSnapshot[`ndt_${t.method}`] = result;
    if (conductedBy) ndtSnapshot[`conducted_by__${t.method}`] = conductedBy;
    if (testDate) ndtSnapshot[`test_date__${t.method}`] = testDate;
    if (result === "Fail") anyFail = true;
    if (result !== "Pass") allRequiredPass = false;

    await supabase.from("operator_ndt_records").insert({
      org_id: orgId,
      oq_id: qualId,
      test_method: t.method,
      result,
      conducted_by: conductedBy,
      test_date: testDate,
      report_pdf_path: reportPath,
    });
  }

  await supabase
    .from("operator_qualifications")
    .update({
      qualification_test_method:
        method as OperatorQualification["qualification_test_method"],
      method1_standard: method1Standard,
    })
    .eq("id", qualId);

  const memberStatus = anyFail
    ? "Failed"
    : allRequiredPass
      ? "Pending_NDT"
      : "Draft";

  await supabase
    .from("qualification_session_members")
    .update({ ndt_results: ndtSnapshot, member_status: memberStatus })
    .eq("id", member.id);

  await supabase
    .from("operator_qualifications")
    .update({ oq_status: memberStatus })
    .eq("id", qualId);
}

export async function saveOperatorGroupNdt(sessionId: string, formData: FormData) {
  const { org, supabase, session, members } =
    await getOperatorSessionOrThrow(sessionId);

  if (sessionHasApprovedMember(members)) {
    throw new Error("Cannot edit NDT after a certificate has been issued.");
  }

  const sharedNdt = formDataToSnapshot(formData);
  const method = formStr(formData.get("qualification_test_method"))!;
  const method1Standard = formStr(formData.get("method1_standard"));

  await supabase
    .from("qualification_sessions")
    .update({
      shared_ndt: sharedNdt,
      session_status: "Pending_NDT",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("org_id", org.id);

  const active = members.filter((m) => m.member_status !== "Removed");
  for (const member of active) {
    if (!member.qualification_id) continue;
    const { data: oqRow } = await supabase
      .from("operator_qualifications")
      .select("*")
      .eq("id", member.qualification_id)
      .single();
    if (!oqRow) continue;
    await saveOperatorMemberNdt(
      supabase,
      org.id,
      member,
      method,
      method1Standard,
      formData,
      oqRow as OperatorQualification,
    );
  }

  revalidatePath(`/operators/qualify/group/${sessionId}`);
  redirect(`/operators/qualify/group/${sessionId}?step=4`);
}

export async function issueOperatorGroupMemberCertificate(
  sessionId: string,
  memberId: string,
  formData: FormData,
) {
  validateOperatorCertificateIssue(formData);
  const { org, supabase, members } =
    await getOperatorSessionOrThrow(sessionId);

  const member = members.find((m) => m.id === memberId);
  if (!member?.qualification_id || !member.operator_id) {
    throw new Error("Member not found.");
  }

  const qualId = member.qualification_id;

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("id", qualId)
    .single();
  if (!oq) throw new Error("Qualification not found.");

  const { data: ndtRows } = await supabase
    .from("operator_ndt_records")
    .select("*")
    .eq("oq_id", qualId);

  if (!operatorNdtReady(oq as OperatorQualification, (ndtRows ?? []) as OperatorNdtRecord[])) {
    throw new Error("NDT must pass before issuing a certificate.");
  }

  const issueDate =
    formStr(formData.get("certificate_date")) ??
    new Date().toISOString().slice(0, 10);
  const q = oq as OperatorQualification;
  const expiry = computeOperatorExpiry(issueDate, q.revalidation_method);

  await supabase
    .from("operator_qualifications")
    .update({
      oq_status: "Approved",
      certificate_issued_date: issueDate,
      continuity_last_verified: issueDate,
      expiry_date: expiry,
      examiner_name: formStr(formData.get("examiner_name")) ?? q.examiner_name,
    })
    .eq("id", qualId);

  await recomputeOperatorRange(qualId);

  await supabase
    .from("qualification_session_members")
    .update({ member_status: "Approved" })
    .eq("id", memberId);

  const allApproved = members
    .filter((m) => m.member_status !== "Removed" && m.id !== memberId)
    .every((m) => m.member_status === "Approved");

  if (allApproved) {
    await supabase
      .from("qualification_sessions")
      .update({ session_status: "Closed" })
      .eq("id", sessionId);
  }

  revalidatePath(`/operators/${member.operator_id}`);
  revalidatePath(`/operators/qualify/group/${sessionId}`);
  revalidatePath("/operators/masterlist");
}

export async function deleteOperatorGroupSession(sessionId: string) {
  await requireOperatorWorkspace();
  const { org } = await requireWritableSession();
  const supabase = await createClient();

  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_14732");
  if (!loaded) throw new Error("Session not found.");

  await deleteGroupSession(supabase, org.id, sessionId, "ISO_14732");

  for (const member of loaded.members) {
    if (member.operator_id) revalidatePath(`/operators/${member.operator_id}`);
  }
  revalidatePath("/operators/qualify/group");
  revalidatePath("/operators");
  revalidatePath("/operators/masterlist");
  redirect("/operators/qualify/group");
}
