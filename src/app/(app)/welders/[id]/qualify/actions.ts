"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile, uploadFiles } from "@/lib/storage";
import { computeRange } from "@/lib/range-engine/iso9606";
import { computeExpiry, extendExpiry } from "@/lib/expiry";
import { requiredTestsFor } from "@/lib/iso9606/constants";
import {
  validateCertificateIssue,
  validateNdtResults,
  validateQualificationPlan,
  validateTestPiece,
} from "@/lib/iso9606/qualification-fields";
import type {
  JointCategory,
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
    jointType: q.joint_type,
    product: q.product,
    testThicknessMm: q.test_thickness_mm,
    depositedThicknessMm: q.deposited_thickness_mm,
    pipeOdMm: q.pipe_od_mm,
    position: q.position,
    materialGroup: q.base_material_group,
  });

  await supabase.from("ranges_of_approval").upsert(
    {
      wpq_id: wpqId,
      thickness_min_mm: range.thicknessMin,
      thickness_max_mm: range.thicknessMax,
      thickness_unlimited: range.thicknessUnlimited,
      pipe_od_min_mm: range.pipeOdMin,
      pipe_od_unlimited: range.pipeOdUnlimited,
      approved_positions: range.approvedPositions,
      approved_material_groups: range.approvedMaterialGroups,
      approved_joint_types: range.approvedJointTypes,
      summary: range.summary,
    },
    { onConflict: "wpq_id" },
  );
}

export async function savePlan(
  welderId: string,
  wpqId: string | null,
  formData: FormData,
) {
  validateQualificationPlan(formData);
  const { org } = await requireSession();
  const supabase = await createClient();

  const payload = {
    org_id: org.id,
    welder_id: welderId,
    standard: "ISO_9606_1" as const,
    testing_standard:
      str(formData.get("testing_standard")) ?? "EN ISO 9606-1:2017",
    process: str(formData.get("process")) ?? "135",
    joint_type: (str(formData.get("joint_type")) ?? "BW") as JointCategory,
    product: (str(formData.get("product")) ?? "Plate") as ProductType,
    position: str(formData.get("position")),
    base_material_group: str(formData.get("base_material_group")),
    wps_reference: str(formData.get("wps_reference")),
    examiner_ref: str(formData.get("examiner_ref")),
    examiner_name: str(formData.get("examiner_name")),
    date_of_welding: str(formData.get("date_of_welding")),
    revalidation_method: (str(formData.get("revalidation_method")) ??
      "9.3b") as RevalidationMethod,
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
    .select("joint_type, product")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .single();
  if (!existing) throw new Error("Qualification not found.");

  validateTestPiece(
    formData,
    existing.joint_type as JointCategory,
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
      dimension_thickness_mm: num(formData.get("dimension_thickness_mm")),
      dimension_width_mm: num(formData.get("dimension_width_mm")),
      dimension_length_mm: num(formData.get("dimension_length_mm")),
      filler_group: str(formData.get("filler_group")),
      filler_designation: str(formData.get("filler_designation")),
      filler_type: str(formData.get("filler_type")),
      shielding_gas: str(formData.get("shielding_gas")),
      current_polarity: str(formData.get("current_polarity")),
      transfer_mode: str(formData.get("transfer_mode")),
      weld_details: str(formData.get("weld_details")),
      test_thickness_mm: num(formData.get("test_thickness_mm")),
      deposited_thickness_mm: num(formData.get("deposited_thickness_mm")),
      pipe_od_mm: num(formData.get("pipe_od_mm")),
      layer_type: str(formData.get("layer_type")),
      position: str(formData.get("position")),
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
  jointType: JointCategory,
  formData: FormData,
) {
  validateNdtResults(formData, jointType);
  const { org } = await requireSession();
  const supabase = await createClient();

  const methods = [
    ...requiredTestsFor(jointType),
    ...formData.getAll("optional_method").map(String).filter(Boolean),
  ];

  // Clear existing rows for idempotent re-save.
  await supabase.from("ndt_dt_records").delete().eq("wpq_id", wpqId);

  let anyFail = false;
  let allRequiredPass = true;

  for (const method of methods) {
    const result = (str(formData.get(`result__${method}`)) ??
      "NA") as "Pass" | "Fail" | "NA";
    const conductedBy = str(formData.get(`conducted_by__${method}`));
    const testDate = str(formData.get(`test_date__${method}`));
    const file = formData.get(`report__${method}`);
    const reportPath = await uploadFile(
      "ndt-reports",
      file instanceof File ? file : null,
      `${org.id}/${wpqId}`,
    );

    if (result === "Fail") anyFail = true;
    if (
      requiredTestsFor(jointType).includes(method) &&
      result !== "Pass"
    ) {
      allRequiredPass = false;
    }

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
    : allRequiredPass
      ? "Pending_NDT"
      : "Draft";

  await supabase
    .from("qualification_records")
    .update({ wpq_status: newStatus })
    .eq("id", wpqId)
    .eq("org_id", org.id);

  revalidatePath(`/welders/${welderId}`);
  const nextStep = allRequiredPass && !anyFail ? 4 : 3;
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
      supplementary_fillet: formData.get("supplementary_fillet") === "on",
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
      "id, wpq_status, certificate_pdf_path, legacy_document_paths, welder_id",
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
  for (const path of q.legacy_document_paths ?? []) {
    if (path) toRemove.push({ bucket: "ndt-reports", path });
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
    .select("id, certificate_pdf_path, legacy_document_paths, welder_id")
    .eq("id", wpqId)
    .eq("org_id", org.id)
    .eq("welder_id", welderId)
    .single();

  if (!wpq) throw new Error("Qualification not found.");
  const q = wpq as Pick<
    QualificationRecord,
    "id" | "certificate_pdf_path" | "legacy_document_paths" | "welder_id"
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
  for (const path of q.legacy_document_paths ?? []) addFile("ndt-reports", path);
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

  const { data: created, error } = await supabase
    .from("qualification_records")
    .insert({
      org_id: org.id,
      welder_id: welderId,
      standard: "ISO_9606_1",
      testing_standard:
        str(formData.get("testing_standard")) ?? "EN ISO 9606-1:2017",
      process: str(formData.get("process")) ?? "135",
      joint_type: (str(formData.get("joint_type")) ?? "BW") as JointCategory,
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
    { method: "Visual (Root)", field: "result_vt" },
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
