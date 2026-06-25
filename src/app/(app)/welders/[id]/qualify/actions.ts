"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile, uploadFiles } from "@/lib/storage";
import { computeRange } from "@/lib/range-engine/iso9606";
import { computeExpiry, extendExpiry } from "@/lib/expiry";
import { VISUAL_TEST_METHOD } from "@/lib/iso9606/constants";
import {
  ndtJointCategory,
  validateCertificateIssue,
  validateNdtResults,
  validateQualificationPlan,
  validateTestPiece,
  wpqReadyForCertificate,
} from "@/lib/iso9606/qualification-fields";
import { branchPipeOdForRange } from "@/lib/iso9606/branch-deposited-thickness";
import { displayJointType, resolveJointStorage } from "@/lib/iso9606/product-dimensions";
import { formatShieldingGas } from "@/lib/iso9606/shielding-gas";
import type {
  BranchConnection,
  JointCategory,
  NdtDtRecord,
  ProductType,
  QualificationRecord,
  RevalidationMethod,
  ValidationKind,
} from "@/types/db";
import { canDiscardWpq } from "@/lib/welder-status";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}
function num(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function recomputeRange(wpqId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", wpqId)
    .single();
  if (!data) return;
  const q = data as QualificationRecord;

  const range = computeRange({
    jointType: ndtJointCategory(q.joint_type),
    product: q.product === "Branch" ? "Pipe" : q.product,
    testThicknessMm: q.test_thickness_mm,
    depositedThicknessMm: q.deposited_thickness_mm,
    process: q.process,
    layer: q.layer_type,
    pipeOdMm: branchPipeOdForRange(q),
    position: q.position,
    materialGroup: q.base_material_group,
    fillerGroup: q.filler_group,
    fillerType: q.filler_type,
    supplementaryFillet: q.supplementary_fillet,
    jointTypeExtended: q.joint_type_extended,
  });

  const { error } = await supabase.from("ranges_of_approval").upsert(
    {
      wpq_id: wpqId,
      thickness_min_mm: range.thicknessMin,
      thickness_max_mm: range.thicknessMax,
      thickness_unlimited: range.thicknessUnlimited,
      pipe_od_min_mm: range.pipeOdMin,
      pipe_od_max_mm: range.pipeOdMax,
      pipe_od_unlimited: range.pipeOdUnlimited,
      approved_positions: range.approvedPositions,
      approved_material_groups: range.approvedMaterialGroups,
      approved_joint_types: range.approvedJointTypes,
      summary: range.summary,
    },
    { onConflict: "wpq_id" },
  );
  if (error) {
    throw new Error(`Failed to save range of approval: ${error.message}`);
  }
}

export async function savePlan(
  welderId: string,
  wpqId: string | null,
  formData: FormData,
) {
  validateQualificationPlan(formData);
  const { org } = await requireSession();
  const supabase = await createClient();

  const rawJoint = str(formData.get("joint_type")) ?? "BW";
  const { joint_type, joint_type_extended } = resolveJointStorage(rawJoint);

  const payload = {
    org_id: org.id,
    welder_id: welderId,
    standard: "ISO_9606_1" as const,
    testing_standard:
      str(formData.get("testing_standard")) ?? "EN ISO 9606-1:2017",
    process: str(formData.get("process")) ?? "135",
    joint_type,
    joint_type_extended,
    product: (str(formData.get("product")) ?? "Plate") as ProductType,
    branch_connection:
      joint_type_extended === "Branch" || str(formData.get("product")) === "Branch"
        ? (str(formData.get("branch_connection")) as BranchConnection)
        : null,
    position: str(formData.get("position")),
    wps_reference: str(formData.get("wps_reference")),
    examiner_ref: str(formData.get("examiner_ref")),
    examiner_name: str(formData.get("examiner_name")),
    date_of_welding: str(formData.get("date_of_welding")),
    revalidation_method: str(
      formData.get("revalidation_method"),
    ) as RevalidationMethod,
    supplementary_fillet: formData.get("supplementary_fillet") === "on",
    supplementary_fillet_position:
      formData.get("supplementary_fillet") === "on"
        ? str(formData.get("supplementary_fillet_position"))
        : null,
    supplementary_fillet_thickness_mm:
      formData.get("supplementary_fillet") === "on"
        ? num(formData.get("supplementary_fillet_thickness_mm"))
        : null,
  };

  let id = wpqId;
  if (id) {
    const { error } = await supabase
      .from("qualification_records")
      .update(payload)
      .eq("id", id)
      .eq("org_id", org.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("qualification_records")
      .insert({ ...payload, wpq_status: "Draft" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    id = data.id;
  }

  await recomputeRange(id!);
  revalidatePath(`/welders/${welderId}`);
  redirect(`/welders/${welderId}/qualify?wpq=${id}&step=2`);
}

export async function saveTest(
  welderId: string,
  wpqId: string,
  formData: FormData,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("qualification_records")
    .select("joint_type, joint_type_extended, product")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .single();
  if (!existing) throw new Error("Qualification not found.");

  const jointLabel = displayJointType(existing as QualificationRecord);

  validateTestPiece(
    formData,
    jointLabel,
    existing.product as ProductType,
  );

  const { error } = await supabase
    .from("qualification_records")
    .update({
      material_specification: str(formData.get("material_standard")),
      material_grade: str(formData.get("material_grade")),
      base_material_group: str(formData.get("base_material_group")),
      material2_specification: str(formData.get("material2_specification")),
      material2_grade: str(formData.get("material2_grade")),
      material2_group: str(formData.get("material2_group")),
      dimensions: str(formData.get("dimensions")),
      dimensions2: str(formData.get("dimensions2")),
      dimension_thickness_mm: num(formData.get("dimension_thickness_mm")),
      dimension_width_mm: num(formData.get("dimension_width_mm")),
      dimension_length_mm: num(formData.get("dimension_length_mm")),
      dimension2_thickness_mm: num(formData.get("dimension2_thickness_mm")),
      dimension2_width_mm: num(formData.get("dimension2_width_mm")),
      dimension2_length_mm: num(formData.get("dimension2_length_mm")),
      dimension2_pipe_od_mm: num(formData.get("dimension2_pipe_od_mm")),
      filler_group: str(formData.get("filler_group")),
      filler_designation: str(formData.get("filler_designation")),
      filler_type: str(formData.get("filler_type")),
      shielding_gas: formatShieldingGas(str(formData.get("shielding_gas"))),
      current_polarity: str(formData.get("current_polarity")),
      transfer_mode: str(formData.get("transfer_mode")),
      weld_details: str(formData.get("weld_details")),
      test_thickness_mm: num(formData.get("test_thickness_mm")),
      deposited_thickness_mm: num(formData.get("deposited_thickness_mm")),
      pipe_od_mm: num(formData.get("pipe_od_mm")),
      layer_type: str(formData.get("layer_type")),
      certificate_pdf_path: null,
    })
    .eq("id", wpqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  await recomputeRange(wpqId);
  revalidatePath(`/welders/${welderId}`);
  redirect(`/welders/${welderId}/qualify?wpq=${wpqId}&step=3`);
}

export async function saveNdt(
  welderId: string,
  wpqId: string,
  jointType: string,
  formData: FormData,
) {
  const ndtJoint = ndtJointCategory(jointType);
  validateNdtResults(formData, ndtJoint);
  const { org } = await requireSession();
  const supabase = await createClient();

  const methods = formData.getAll("selected_method").map(String).filter(Boolean);

  const { data: existingNdt } = await supabase
    .from("ndt_dt_records")
    .select("test_method, report_pdf_path")
    .eq("wpq_id", wpqId);
  const existingByMethod = new Map(
    (existingNdt ?? []).map((r) => [r.test_method, r.report_pdf_path as string | null]),
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

  // Clear existing rows for idempotent re-save.
  await supabase.from("ndt_dt_records").delete().eq("wpq_id", wpqId);

  let anyFail = false;
  let allSelectedPass = methods.length > 0;

  for (const method of methods) {
    const result = (str(formData.get(`result__${method}`)) ??
      "NA") as "Pass" | "Fail" | "NA";
    const conductedBy = str(formData.get(`conducted_by__${method}`));
    const testDate = str(formData.get(`test_date__${method}`));
    const file = formData.get(`report__${method}`);
    const uploaded = await uploadFile(
      "ndt-reports",
      file instanceof File ? file : null,
      `${org.id}/${wpqId}`,
    );
    const reportPath =
      uploaded ?? existingReportPath(method) ?? null;

    if (result === "Fail") anyFail = true;
    if (result !== "Pass") allSelectedPass = false;

    await supabase.from("ndt_dt_records").insert({
      org_id: org.id,
      wpq_id: wpqId,
      test_method: method,
      result,
      conducted_by: conductedBy,
      test_date: testDate,
      report_pdf_path: reportPath,
    });
  }

  const newStatus = anyFail
    ? "Failed"
    : methods.length > 0 && allSelectedPass
      ? "Pending_NDT"
      : "Draft";

  await supabase
    .from("qualification_records")
    .update({ wpq_status: newStatus })
    .eq("id", wpqId)
    .eq("org_id", org.id);

  revalidatePath(`/welders/${welderId}`);
  const nextStep = anyFail ? 3 : 4;
  redirect(`/welders/${welderId}/qualify?wpq=${wpqId}&step=${nextStep}`);
}

export async function issueCertificate(
  welderId: string,
  wpqId: string,
  formData: FormData,
) {
  validateCertificateIssue(formData);
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .single();
  if (!wpq) throw new Error("Qualification not found.");
  const q = wpq as QualificationRecord;

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("test_method, result")
    .eq("wpq_id", wpqId);
  if (!wpqReadyForCertificate(q, (ndtRows ?? []) as Pick<NdtDtRecord, "test_method" | "result">[])) {
    throw new Error(
      "All selected NDT tests must pass before issuing a certificate.",
    );
  }

  const issueDate = str(formData.get("certificate_date")) ?? new Date()
    .toISOString()
    .slice(0, 10);
  const expiry = computeExpiry(q.revalidation_method, issueDate);

  const { error } = await supabase
    .from("qualification_records")
    .update({
      wpq_status: "Approved",
      certificate_issued_date: issueDate,
      continuity_last_verified: issueDate,
      expiry_date: expiry,
      job_knowledge: str(formData.get("job_knowledge")) ?? q.job_knowledge,
      examiner_name:
        str(formData.get("examiner_name")) ?? q.examiner_name,
    })
    .eq("id", wpqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  await recomputeRange(wpqId);
  revalidatePath(`/welders/${welderId}`);
  redirect(`/welders/${welderId}?issued=${wpqId}`);
}

export async function discardWpq(welderId: string, wpqId: string) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select(
      "id, wpq_status, certificate_pdf_path, signed_certificate_pdf_path, legacy_document_paths, welder_id",
    )
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .eq("welder_id", welderId)
    .single();

  if (!wpq) throw new Error("Qualification not found.");
  const q = wpq as Pick<
    QualificationRecord,
    | "id"
    | "wpq_status"
    | "certificate_pdf_path"
    | "signed_certificate_pdf_path"
    | "legacy_document_paths"
    | "welder_id"
  >;

  if (!canDiscardWpq(q.wpq_status)) {
    throw new Error(
      "Only draft, pending, or failed qualifications can be discarded.",
    );
  }

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("report_pdf_path")
    .eq("wpq_id", wpqId);

  const toRemove: { bucket: string; path: string }[] = [];
  if (q.certificate_pdf_path) {
    toRemove.push({ bucket: "generated-pdfs", path: q.certificate_pdf_path });
  }
  if (q.signed_certificate_pdf_path) {
    toRemove.push({
      bucket: "generated-pdfs",
      path: q.signed_certificate_pdf_path,
    });
  }
  for (const path of q.legacy_document_paths ?? []) {
    if (path) toRemove.push({ bucket: "legacy-docs", path });
  }
  for (const row of ndtRows ?? []) {
    if (row.report_pdf_path) {
      toRemove.push({ bucket: "ndt-reports", path: row.report_pdf_path });
    }
  }

  for (const { bucket, path } of toRemove) {
    await supabase.storage.from(bucket).remove([path]);
  }

  const { error } = await supabase
    .from("qualification_records")
    .delete()
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .eq("welder_id", welderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/welders/${welderId}`);
  revalidatePath("/masterlist");
  revalidatePath("/welders");
  redirect(`/welders/${welderId}`);
}

/**
 * Permanently deletes a qualification regardless of status, along with every
 * file it owns (certificate, NDT reports, legacy docs, validation evidence).
 * Child rows (ranges, NDT, validation logs) are removed via DB cascade.
 */
export async function deleteWpq(welderId: string, wpqId: string) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("id, certificate_pdf_path, signed_certificate_pdf_path, legacy_document_paths, welder_id")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .eq("welder_id", welderId)
    .single();

  if (!wpq) throw new Error("Qualification not found.");
  const q = wpq as Pick<
    QualificationRecord,
    "id" | "certificate_pdf_path" | "signed_certificate_pdf_path" | "legacy_document_paths" | "welder_id"
  >;

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("report_pdf_path")
    .eq("wpq_id", wpqId);
  const { data: valRows } = await supabase
    .from("validation_records")
    .select("supporting_doc_path")
    .eq("wpq_id", wpqId);

  const byBucket: Record<string, string[]> = {};
  const addFile = (bucket: string, path: string | null | undefined) => {
    if (path) (byBucket[bucket] ??= []).push(path);
  };
  addFile("generated-pdfs", q.certificate_pdf_path);
  addFile("generated-pdfs", q.signed_certificate_pdf_path);
  for (const path of q.legacy_document_paths ?? []) addFile("legacy-docs", path);
  for (const row of ndtRows ?? []) addFile("ndt-reports", row.report_pdf_path);
  for (const row of valRows ?? [])
    addFile("ndt-reports", row.supporting_doc_path);

  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  const { error } = await supabase
    .from("qualification_records")
    .delete()
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .eq("welder_id", welderId);

  if (error) throw new Error(error.message);

  revalidatePath(`/welders/${welderId}`);
  revalidatePath("/masterlist");
  revalidatePath("/welders");
  redirect(`/welders/${welderId}`);
}

/** Deletes a single continuity/revalidation log entry and its uploaded doc. */
export async function deleteValidation(
  welderId: string,
  validationId: string,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: rec } = await supabase
    .from("validation_records")
    .select("id, supporting_doc_path")
    .eq("id", validationId)
    .eq("org_id", org.id)
    .single();

  if (!rec) throw new Error("Log entry not found.");
  const r = rec as { id: string; supporting_doc_path: string | null };

  if (r.supporting_doc_path) {
    await supabase.storage.from("ndt-reports").remove([r.supporting_doc_path]);
  }

  const { error } = await supabase
    .from("validation_records")
    .delete()
    .eq("id", validationId)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/welders/${welderId}`);
}

export async function saveValidation(
  welderId: string,
  wpqId: string,
  formData: FormData,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .single();
  if (!wpq) throw new Error("Qualification not found.");
  const q = wpq as QualificationRecord;

  const validatedOn =
    str(formData.get("validated_on")) ?? new Date().toISOString().slice(0, 10);
  const kind = (str(formData.get("kind")) ?? "continuity") as ValidationKind;
  const validatorName = str(formData.get("validator_name"));
  const note = str(formData.get("note"));

  const doc = formData.get("supporting_doc");
  const docPath = await uploadFile(
    "ndt-reports",
    doc instanceof File ? doc : null,
    `${org.id}/${wpqId}/validations`,
  );

  // Continuity (9.2) resets the 6-month clock; revalidation extends expiry.
  let newExpiry = q.expiry_date;
  if (kind === "revalidation") {
    const base =
      q.expiry_date && new Date(q.expiry_date) > new Date()
        ? q.expiry_date
        : validatedOn;
    newExpiry = extendExpiry(q.revalidation_method, base);
  }

  const { error: insertError } = await supabase
    .from("validation_records")
    .insert({
      org_id: org.id,
      wpq_id: wpqId,
      validated_on: validatedOn,
      supporting_doc_path: docPath,
      new_expiry_date: newExpiry,
      validator_name: validatorName,
      note,
      kind,
    });
  if (insertError) {
    throw new Error(`Could not log entry: ${insertError.message}`);
  }

  const { error: updateError } = await supabase
    .from("qualification_records")
    .update({
      continuity_last_verified:
        kind === "continuity" ? validatedOn : q.continuity_last_verified,
      expiry_date: newExpiry,
      certificate_pdf_path: null,
      wpq_status:
        newExpiry && new Date(newExpiry) > new Date() ? "Approved" : q.wpq_status,
    })
    .eq("id", wpqId)
    .eq("org_id", org.id);
  if (updateError) {
    throw new Error(`Could not update qualification: ${updateError.message}`);
  }

  // Refresh in place (no redirect) so the selected qualification stays
  // selected in the master-detail view after logging an entry.
  revalidatePath(`/welders/${welderId}`);
}

export async function saveLegacy(welderId: string, formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const initialDate =
    str(formData.get("date_of_welding")) ??
    new Date().toISOString().slice(0, 10);
  const method = (str(formData.get("revalidation_method")) ??
    "9.3b") as RevalidationMethod;
  const expiryOverride = str(formData.get("expiry_date"));
  const continuityDate = str(formData.get("continuity_last_verified"));

  const legacyFiles = formData
    .getAll("legacy_docs")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const scanPaths = await uploadFiles(
    "legacy-docs",
    legacyFiles,
    `${org.id}/${welderId}`,
  );
  const singleScan = formData.get("legacy_doc");
  if (singleScan instanceof File && singleScan.size > 0) {
    const one = await uploadFile(
      "legacy-docs",
      singleScan,
      `${org.id}/${welderId}`,
    );
    if (one) scanPaths.push(one);
  }

  const legacyJoint = resolveJointStorage(str(formData.get("joint_type")) ?? "BW");

  const { data: created, error } = await supabase
    .from("qualification_records")
    .insert({
      org_id: org.id,
      welder_id: welderId,
      standard: "ISO_9606_1",
      testing_standard:
        str(formData.get("testing_standard")) ?? "EN ISO 9606-1:2017",
      process: str(formData.get("process")) ?? "135",
      joint_type: legacyJoint.joint_type,
      joint_type_extended: legacyJoint.joint_type_extended,
      product: (str(formData.get("product")) ?? "Plate") as ProductType,
      position: str(formData.get("position")),
      base_material_group: str(formData.get("base_material_group")),
      filler_group: str(formData.get("filler_group")),
      filler_type: str(formData.get("filler_type")),
      test_thickness_mm: num(formData.get("test_thickness_mm")),
      deposited_thickness_mm: num(formData.get("deposited_thickness_mm")),
      pipe_od_mm: num(formData.get("pipe_od_mm")),
      date_of_welding: initialDate,
      revalidation_method: method,
      is_legacy: true,
      wpq_status: "Approved",
      certificate_issued_date: initialDate,
      continuity_last_verified: continuityDate ?? initialDate,
      expiry_date: expiryOverride ?? computeExpiry(method, initialDate),
      certificate_pdf_path: scanPaths[0] ?? null,
      legacy_document_paths: scanPaths,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const wpqId = created.id;
  await recomputeRange(wpqId);

  const legacyTests = [
    { method: VISUAL_TEST_METHOD, field: "result_vt" },
    { method: "RT/UT", field: "result_rt_ut" },
    { method: "Fracture Test", field: "result_fracture" },
  ] as const;

  for (const t of legacyTests) {
    const result = str(formData.get(t.field)) ?? "NA";
    if (result === "NA") continue;
    await supabase.from("ndt_dt_records").insert({
      org_id: org.id,
      wpq_id: wpqId,
      test_method: t.method,
      result: result as "Pass" | "Fail" | "NA",
      test_date: initialDate,
    });
  }

  revalidatePath(`/welders/${welderId}`);
  redirect(`/welders/${welderId}`);
}

/** Upload a manually signed certificate scan (PDF or image). */
export async function uploadSignedCertificate(
  welderId: string,
  wpqId: string,
  formData: FormData,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("id, wpq_status, signed_certificate_pdf_path")
    .eq("id", wpqId)
    .eq("welder_id", welderId)
    .eq("org_id", org.id)
    .single();

  if (!wpq) throw new Error("Qualification not found.");
  if (wpq.wpq_status !== "Approved") {
    throw new Error(
      "Only approved qualifications can have a signed certificate uploaded.",
    );
  }

  const file = formData.get("signed_certificate");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select a signed certificate file to upload.");
  }

  const path = await uploadFile(
    "generated-pdfs",
    file,
    `${org.id}/${welderId}/signed`,
  );
  if (!path) throw new Error("Upload failed.");

  if (wpq.signed_certificate_pdf_path) {
    await supabase.storage
      .from("generated-pdfs")
      .remove([wpq.signed_certificate_pdf_path]);
  }

  const { error } = await supabase
    .from("qualification_records")
    .update({ signed_certificate_pdf_path: path })
    .eq("id", wpqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/welders/${welderId}`);
}
