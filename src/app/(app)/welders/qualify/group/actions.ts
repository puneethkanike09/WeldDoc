"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { requireWritableSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { computeExpiry } from "@/lib/expiry";
import { VISUAL_TEST_METHOD } from "@/lib/iso9606/constants";
import { recomputeWpqRange } from "@/lib/iso9606/recompute-wpq-range";
import {
  ndtJointCategory,
  validateCertificateIssue,
  validateNdtResults,
  validateQualificationPlan,
  validateTestPiece,
  wpqReadyForCertificate,
} from "@/lib/iso9606/qualification-fields";
import { displayJointType } from "@/lib/iso9606/product-dimensions";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
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
import { welderJointLabelFromPlan } from "@/lib/qualify/group-session/welder";
import {
  createWelderRecord,
} from "@/lib/welders/create-record";
import {
  parseNewPersonPrefixes,
  sliceNewPersonFormData,
} from "@/lib/qualify/group-session/participant-form";
import type {
  NdtDtRecord,
  ProductType,
  QualificationRecord,
  QualificationSessionMember,
  TestResult,
} from "@/types/db";

function parseIds(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

async function getWelderSessionOrThrow(sessionId: string) {
  await requireWelderWorkspace();
  const { org } = await requireWritableSession();
  const supabase = await createClient();
  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_9606_1");
  if (!loaded) throw new Error("Session not found.");
  return { org, supabase, ...loaded };
}

export async function createWelderGroupSession(formData: FormData) {
  await requireWelderWorkspace();
  const { org, userId } = await requireWritableSession();
  const supabase = await createClient();

  const existingIds = parseIds(formData, "existing_ids");
  const prefixes = parseNewPersonPrefixes(formData);
  const expectedCount = Number.parseInt(
    formStr(formData.get("participant_count")) ?? "",
    10,
  );
  const createdWelderIds: string[] = [];
  const allPersonIds = [...existingIds];
  let sessionId: string | null = null;

  try {
    for (const prefix of prefixes) {
      const slice = sliceNewPersonFormData(formData, prefix, "welder_id");
      const id = await createWelderRecord(supabase, { org, userId }, slice);
      createdWelderIds.push(id);
      allPersonIds.push(id);
    }

    if (allPersonIds.length === 0) {
      throw new Error("Select or add at least one welder.");
    }

    if (
      Number.isFinite(expectedCount) &&
      expectedCount > 0 &&
      allPersonIds.length !== expectedCount
    ) {
      throw new Error(
        `Could not register all ${expectedCount} participants. Only ${allPersonIds.length} were saved — check new welder details and try again.`,
      );
    }

    const { data: session, error: sessionErr } = await supabase
      .from("qualification_sessions")
      .insert({
        org_id: org.id,
        standard: "ISO_9606_1",
        created_by: userId,
      })
      .select("id")
      .single();
    if (sessionErr) throw new Error(sessionErr.message);
    sessionId = session.id;

    const memberRows = allPersonIds.map((welderId) => ({
      session_id: session.id,
      org_id: org.id,
      welder_id: welderId,
    }));

    const { error: memberErr } = await supabase
      .from("qualification_session_members")
      .insert(memberRows);
    if (memberErr) throw new Error(memberErr.message);

    const { data: welderRows } = await supabase
      .from("welders")
      .select("welder_id")
      .in("id", allPersonIds);
    const label = formatGroupSessionLabel(
      null,
      (welderRows ?? []).map(
        (row) => (row as { welder_id: string | null }).welder_id,
      ),
      "welder",
    );
    if (label) {
      await supabase
        .from("qualification_sessions")
        .update({ label })
        .eq("id", session.id);
    }

    revalidatePath("/welders");
    revalidatePath("/welders/qualify/group");
    redirect(`/welders/qualify/group/${session.id}?step=1`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (sessionId) {
      await supabase.from("qualification_sessions").delete().eq("id", sessionId);
    }
    for (const id of createdWelderIds) {
      await supabase.from("welders").delete().eq("id", id);
    }
    throw err;
  }
}

export async function saveWelderGroupPlan(sessionId: string, formData: FormData) {
  validateQualificationPlan(formData);
  const { org, supabase, session, members } =
    await getWelderSessionOrThrow(sessionId);

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
    "welder",
  );

  revalidatePath(`/welders/qualify/group/${sessionId}`);
  redirect(`/welders/qualify/group/${sessionId}?step=2`);
}

export async function saveWelderGroupTestPiece(
  sessionId: string,
  formData: FormData,
) {
  const { org, supabase, session, members } =
    await getWelderSessionOrThrow(sessionId);

  if (sessionHasApprovedMember(members)) {
    throw new Error("Cannot edit test piece after a certificate has been issued.");
  }

  const jointLabel = welderJointLabelFromPlan(session.shared_plan);
  const product = (snapshotStr(session.shared_plan, "product") ??
    "Plate") as ProductType;

  validateTestPiece(formData, jointLabel, product);

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

  revalidatePath(`/welders/qualify/group/${sessionId}`);
  redirect(`/welders/qualify/group/${sessionId}?step=3`);
}

async function saveWelderMemberNdt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  member: QualificationSessionMember,
  methods: string[],
  formData: FormData,
  jointLabel: string,
) {
  const qualId = member.qualification_id;
  if (!qualId || !member.welder_id) return;

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", qualId)
    .single();
  if (!wpq) return;

  const probe = new FormData();
  for (const method of methods) {
    probe.append("selected_method", method);
    const result = formStr(
      formData.get(`member_${member.id}_result__${method}`),
    );
    if (result) probe.set(`result__${method}`, result);
    const date = formStr(
      formData.get(`member_${member.id}_test_date__${method}`),
    );
    if (date) probe.set(`test_date__${method}`, date);
    const ref = formStr(
      formData.get(`member_${member.id}_conducted_by__${method}`),
    );
    if (ref) probe.set(`conducted_by__${method}`, ref);
  }
  validateNdtResults(probe, ndtJointCategory(jointLabel));

  const { data: existingNdt } = await supabase
    .from("ndt_dt_records")
    .select("test_method, report_pdf_path")
    .eq("wpq_id", qualId);
  const existingByMethod = new Map(
    (existingNdt ?? []).map((r) => [
      r.test_method,
      r.report_pdf_path as string | null,
    ]),
  );

  function existingReportPath(method: string): string | null {
    const direct = existingByMethod.get(method);
    if (direct) return direct;
    if (method === VISUAL_TEST_METHOD) {
      return (
        existingByMethod.get("Visual (Root)") ??
        existingByMethod.get("Visual (Cap)") ??
        null
      );
    }
    return null;
  }

  await supabase.from("ndt_dt_records").delete().eq("wpq_id", qualId);

  let anyFail = false;
  let allSelectedPass = methods.length > 0;
  const ndtSnapshot: Record<string, string> = {};

  for (const method of methods) {
    const result = (formStr(
      formData.get(`member_${member.id}_result__${method}`),
    ) ?? "Pass") as TestResult;
    const conductedBy = formStr(
      formData.get(`member_${member.id}_conducted_by__${method}`),
    );
    const testDate = formStr(
      formData.get(`member_${member.id}_test_date__${method}`),
    );
    const file = formData.get(`member_${member.id}_report__${method}`);
    const uploaded = await uploadFile(
      "ndt-reports",
      file instanceof File && file.size > 0 ? file : null,
      `${orgId}/wpq-${qualId}`,
    );
    const reportPath = uploaded ?? existingReportPath(method) ?? null;

    ndtSnapshot[`result__${method}`] = result;
    if (conductedBy) ndtSnapshot[`conducted_by__${method}`] = conductedBy;
    if (testDate) ndtSnapshot[`test_date__${method}`] = testDate;
    if (result === "Fail") anyFail = true;
    if (result !== "Pass") allSelectedPass = false;

    await supabase.from("ndt_dt_records").insert({
      org_id: orgId,
      wpq_id: qualId,
      test_method: method,
      result,
      conducted_by: conductedBy,
      test_date: testDate,
      report_pdf_path: reportPath,
    });
  }

  const memberStatus = anyFail
    ? "Failed"
    : methods.length > 0 && allSelectedPass
      ? "Pending_NDT"
      : "Draft";

  await supabase
    .from("qualification_session_members")
    .update({ ndt_results: ndtSnapshot, member_status: memberStatus })
    .eq("id", member.id);

  await supabase
    .from("qualification_records")
    .update({ wpq_status: memberStatus })
    .eq("id", qualId);
}

export async function saveWelderGroupNdt(sessionId: string, formData: FormData) {
  const { org, supabase, session, members } =
    await getWelderSessionOrThrow(sessionId);

  if (sessionHasApprovedMember(members)) {
    throw new Error("Cannot edit NDT after a certificate has been issued.");
  }

  const sharedNdt = formDataToSnapshot(formData);
  const methods = formData.getAll("selected_method").map(String).filter(Boolean);
  const jointLabel = welderJointLabelFromPlan(session.shared_plan);

  await supabase
    .from("qualification_sessions")
    .update({
      shared_ndt: { ...sharedNdt, selected_methods: methods },
      session_status: "Pending_NDT",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("org_id", org.id);

  const active = members.filter((m) => m.member_status !== "Removed");
  for (const member of active) {
    await saveWelderMemberNdt(
      supabase,
      org.id,
      member,
      methods,
      formData,
      jointLabel,
    );
  }

  revalidatePath(`/welders/qualify/group/${sessionId}`);
  redirect(`/welders/qualify/group/${sessionId}?step=4`);
}

export async function issueWelderGroupMemberCertificate(
  sessionId: string,
  memberId: string,
  formData: FormData,
) {
  validateCertificateIssue(formData);
  const { org, supabase, members } = await getWelderSessionOrThrow(sessionId);

  const member = members.find((m) => m.id === memberId);
  if (!member?.qualification_id || !member.welder_id) {
    throw new Error("Member not found.");
  }

  const qualId = member.qualification_id;

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", qualId)
    .single();
  if (!wpq) throw new Error("Qualification not found.");

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("test_method, result")
    .eq("wpq_id", qualId);

  if (
    !wpqReadyForCertificate(
      wpq as QualificationRecord,
      (ndtRows ?? []) as Pick<NdtDtRecord, "test_method" | "result">[],
    )
  ) {
    throw new Error("NDT must pass before issuing a certificate.");
  }

  const issueDate =
    formStr(formData.get("certificate_date")) ??
    new Date().toISOString().slice(0, 10);
  const q = wpq as QualificationRecord;
  const expiry = computeExpiry(q.revalidation_method, issueDate);

  await supabase
    .from("qualification_records")
    .update({
      wpq_status: "Approved",
      certificate_issued_date: issueDate,
      continuity_last_verified: issueDate,
      expiry_date: expiry,
      job_knowledge: formStr(formData.get("job_knowledge")) ?? q.job_knowledge,
      examiner_name: formStr(formData.get("examiner_name")) ?? q.examiner_name,
    })
    .eq("id", qualId);

  await recomputeWpqRange(qualId);

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

  revalidatePath(`/welders/${member.welder_id}`);
  revalidatePath(`/welders/qualify/group/${sessionId}`);
  revalidatePath("/welders/masterlist");
}

export async function deleteWelderGroupSession(sessionId: string) {
  await requireWelderWorkspace();
  const { org } = await requireWritableSession();
  const supabase = await createClient();

  const loaded = await loadSession(supabase, org.id, sessionId, "ISO_9606_1");
  if (!loaded) throw new Error("Session not found.");

  await deleteGroupSession(supabase, org.id, sessionId, "ISO_9606_1");

  for (const member of loaded.members) {
    if (member.welder_id) revalidatePath(`/welders/${member.welder_id}`);
  }
  revalidatePath("/welders/qualify/group");
  revalidatePath("/welders");
  revalidatePath("/welders/masterlist");
  redirect("/welders/qualify/group");
}
