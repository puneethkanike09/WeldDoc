"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import {
  computeOperatorExpiry,
  computeOperatorRevalidationExpiry,
} from "@/lib/iso14732/expiry";
import { recomputeOperatorRange } from "@/lib/iso14732/recompute-operator-range";
import { canDiscardOq } from "@/lib/operator-status";
import {
  requiredNdtTests,
  ndtResultsPass,
  TESTING_STANDARD,
} from "@/lib/iso14732/constants";
import {
  operatorNdtReady,
  validateOperatorCertificateIssue,
  validateOperatorNdt,
  validateOperatorPlan,
  validateOperatorTestPiece,
} from "@/lib/iso14732/qualification-fields";
import type {
  OperatorNdtRecord,
  OperatorQualification,
  OperatorRevalidationMethod,
  OperatorTechnologyKnowledge,
  OperatorWeldingMode,
  OperatorWeldingType,
  TestResult,
  ValidationKind,
} from "@/types/db";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function qualifyIds(formData: FormData) {
  const operatorId = str(formData.get("_operator_id"));
  const oqId = str(formData.get("_oq_id"));
  if (!operatorId) throw new Error("Missing operator.");
  return { operatorId, oqId };
}

export async function saveOperatorPlan(formData: FormData) {
  const { operatorId, oqId } = qualifyIds(formData);
  validateOperatorPlan(formData);
  const { org } = await requireSession();
  const supabase = await createClient();

  const payload = {
    org_id: org.id,
    operator_id: operatorId,
    standard: "ISO_14732" as const,
    testing_standard: TESTING_STANDARD,
    date_of_welding: str(formData.get("date_of_welding")),
    welding_type: str(formData.get("welding_type")) as OperatorWeldingType,
    process: str(formData.get("process")),
    product_type: str(formData.get("product_type")),
    joint_type: str(formData.get("joint_type")),
    welding_mode: str(formData.get("welding_mode")) as OperatorWeldingMode,
    wps_reference: str(formData.get("wps_reference")),
    employer_branch: str(formData.get("employer_branch")),
    functional_knowledge_ref: str(formData.get("functional_knowledge_ref")),
    welding_technology_knowledge: str(
      formData.get("welding_technology_knowledge"),
    ) as OperatorTechnologyKnowledge,
    examiner_ref: str(formData.get("examiner_ref")),
    examiner_name: str(formData.get("examiner_name")),
    revalidation_method: str(
      formData.get("revalidation_method"),
    ) as OperatorRevalidationMethod,
  };

  let id = oqId;
  if (id) {
    const { error } = await supabase
      .from("operator_qualifications")
      .update(payload)
      .eq("id", id)
      .eq("org_id", org.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("operator_qualifications")
      .insert({ ...payload, oq_status: "Draft" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    id = data.id;
  }

  await recomputeOperatorRange(id!);
  revalidatePath(`/operators/${operatorId}`);
  redirect(`/operators/${operatorId}/qualify?oq=${id}&step=2`);
}

export async function saveOperatorTestPiece(formData: FormData) {
  const { operatorId, oqId } = qualifyIds(formData);
  if (!oqId) throw new Error("Qualification not found.");
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("operator_qualifications")
    .select("welding_mode")
    .eq("id", oqId)
    .eq("org_id", org.id)
    .single();
  if (!existing) throw new Error("Qualification not found.");

  const mode = existing.welding_mode as OperatorWeldingMode | null;
  validateOperatorTestPiece(formData, mode);

  const { error } = await supabase
    .from("operator_qualifications")
    .update({
      equipment_power_source: str(formData.get("equipment_power_source")),
      equipment_unit_details: str(formData.get("equipment_unit_details")),
      visual_or_remote_control: str(formData.get("visual_or_remote_control")),
      automatic_joint_tracking: str(formData.get("automatic_joint_tracking")),
      automatic_arc_length_control: str(formData.get("automatic_arc_length_control")),
      single_multi_run: str(formData.get("single_multi_run")),
      orbital_position: str(formData.get("orbital_position")),
      material_backing: str(formData.get("material_backing")),
      material_backing_type: str(formData.get("material_backing_type")),
      consumable_insert: str(formData.get("consumable_insert")),
      material_spec_info: str(formData.get("material_spec_info")),
      test_piece_dimensions_info: str(formData.get("test_piece_dimensions_info")),
      filler_designation_info: str(formData.get("filler_designation_info")),
    })
    .eq("id", oqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  await recomputeOperatorRange(oqId);
  revalidatePath(`/operators/${operatorId}`);
  redirect(`/operators/${operatorId}/qualify?oq=${oqId}&step=3`);
}

export async function saveOperatorNdt(formData: FormData) {
  const { operatorId, oqId } = qualifyIds(formData);
  if (!oqId) throw new Error("Qualification not found.");
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oqRow } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("id", oqId)
    .eq("org_id", org.id)
    .single();
  if (!oqRow) throw new Error("Qualification not found.");
  const oq = oqRow as OperatorQualification;

  validateOperatorNdt(formData, oq);

  const method = str(formData.get("qualification_test_method"))!;
  const method1Standard = str(formData.get("method1_standard"));

  await supabase
    .from("operator_qualifications")
    .update({
      qualification_test_method: method as OperatorQualification["qualification_test_method"],
      method1_standard: method1Standard,
    })
    .eq("id", oqId);

  const { data: existingNdt } = await supabase
    .from("operator_ndt_records")
    .select("test_method, report_pdf_path")
    .eq("oq_id", oqId);
  const existingByMethod = new Map(
    (existingNdt ?? []).map((r) => [
      r.test_method,
      r.report_pdf_path as string | null,
    ]),
  );

  await supabase.from("operator_ndt_records").delete().eq("oq_id", oqId);

  const tests = requiredNdtTests({
    ...oq,
    qualification_test_method: method as OperatorQualification["qualification_test_method"],
    method1_standard: method1Standard,
  });

  let anyFail = false;
  for (const t of tests) {
    const result = str(formData.get(`ndt_${t.method}`)) as TestResult;
    if (result === "Fail") anyFail = true;
    const file = formData.get(`report__${t.method}`);
    const uploaded = await uploadFile(
      "ndt-reports",
      file instanceof File ? file : null,
      `${org.id}/oq-${oqId}`,
    );
    const reportPath =
      uploaded ?? existingByMethod.get(t.method) ?? null;
    await supabase.from("operator_ndt_records").insert({
      org_id: org.id,
      oq_id: oqId,
      test_method: t.method,
      result,
      report_pdf_path: reportPath,
      conducted_by: str(formData.get(`conducted_by__${t.method}`)),
      test_date: str(formData.get(`test_date__${t.method}`)),
    });
  }

  const results = tests.map(
    (t) => str(formData.get(`ndt_${t.method}`)) as TestResult,
  );
  const newStatus = anyFail
    ? "Failed"
    : ndtResultsPass(results)
      ? "Pending_NDT"
      : "Draft";

  await supabase
    .from("operator_qualifications")
    .update({ oq_status: newStatus })
    .eq("id", oqId);

  revalidatePath(`/operators/${operatorId}`);
  const ndtFlash = anyFail ? "failed" : "saved";
  redirect(
    `/operators/${operatorId}/qualify?oq=${oqId}&step=4&ndt=${ndtFlash}`,
  );
}

export async function issueOperatorCertificate(formData: FormData) {
  const { operatorId, oqId } = qualifyIds(formData);
  if (!oqId) throw new Error("Qualification not found.");
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oqRow } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("id", oqId)
    .eq("org_id", org.id)
    .single();
  if (!oqRow) throw new Error("Qualification not found.");
  const oq = oqRow as OperatorQualification;

  validateOperatorCertificateIssue(formData);

  const { data: ndtRows } = await supabase
    .from("operator_ndt_records")
    .select("test_method, result")
    .eq("oq_id", oqId);
  if (
    !operatorNdtReady(oq, (ndtRows ?? []) as OperatorNdtRecord[])
  ) {
    throw new Error(
      "All required NDT tests must pass before issuing a certificate.",
    );
  }

  const issueDate =
    str(formData.get("certificate_date")) ?? new Date().toISOString().slice(0, 10);
  const expiry = computeOperatorExpiry(issueDate, oq.revalidation_method);

  const { error } = await supabase
    .from("operator_qualifications")
    .update({
      oq_status: "Approved",
      certificate_issued_date: issueDate,
      continuity_last_verified: issueDate,
      expiry_date: expiry,
      examiner_name: str(formData.get("examiner_name")) ?? oq.examiner_name,
    })
    .eq("id", oqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  await recomputeOperatorRange(oqId);
  revalidatePath(`/operators/${operatorId}`);
  redirect(`/operators/${operatorId}?oq=${oqId}`);
}

export async function uploadSignedOperatorCertificate(formData: FormData) {
  const { operatorId, oqId } = qualifyIds(formData);
  if (!oqId) throw new Error("Qualification not found.");
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("id, oq_status, signed_certificate_pdf_path")
    .eq("id", oqId)
    .eq("operator_id", operatorId)
    .eq("org_id", org.id)
    .single();

  if (!oq) throw new Error("Qualification not found.");
  if (oq.oq_status !== "Approved") {
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
    `${org.id}/operator-oq/${oqId}`,
  );
  if (!path) throw new Error("Upload failed.");

  if (oq.signed_certificate_pdf_path) {
    await supabase.storage
      .from("generated-pdfs")
      .remove([oq.signed_certificate_pdf_path]);
  }

  const { error } = await supabase
    .from("operator_qualifications")
    .update({ signed_certificate_pdf_path: path })
    .eq("id", oqId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/operators/${operatorId}`);
}

export async function discardOq(operatorId: string, oqId: string) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select(
      "id, oq_status, certificate_pdf_path, signed_certificate_pdf_path, operator_id",
    )
    .eq("id", oqId)
    .eq("org_id", org.id)
    .eq("operator_id", operatorId)
    .single();

  if (!oq) throw new Error("Qualification not found.");

  if (!canDiscardOq(oq.oq_status)) {
    throw new Error(
      "Only draft, pending, or failed qualifications can be discarded.",
    );
  }

  const { data: ndtRows } = await supabase
    .from("operator_ndt_records")
    .select("report_pdf_path")
    .eq("oq_id", oqId);

  const toRemove: { bucket: string; path: string }[] = [];
  if (oq.certificate_pdf_path) {
    toRemove.push({ bucket: "generated-pdfs", path: oq.certificate_pdf_path });
  }
  if (oq.signed_certificate_pdf_path) {
    toRemove.push({
      bucket: "generated-pdfs",
      path: oq.signed_certificate_pdf_path,
    });
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
    .from("operator_qualifications")
    .delete()
    .eq("id", oqId)
    .eq("org_id", org.id)
    .eq("operator_id", operatorId);

  if (error) throw new Error(error.message);

  revalidatePath(`/operators/${operatorId}`);
  revalidatePath("/operators");
  revalidatePath("/operators/masterlist");
  redirect(`/operators/${operatorId}`);
}

export async function deleteOq(operatorId: string, oqId: string) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select(
      "id, certificate_pdf_path, signed_certificate_pdf_path, operator_id",
    )
    .eq("id", oqId)
    .eq("org_id", org.id)
    .eq("operator_id", operatorId)
    .single();

  if (!oq) throw new Error("Qualification not found.");

  const { data: ndtRows } = await supabase
    .from("operator_ndt_records")
    .select("report_pdf_path")
    .eq("oq_id", oqId);
  const { data: valRows } = await supabase
    .from("operator_validations")
    .select("supporting_doc_path")
    .eq("oq_id", oqId);

  const byBucket: Record<string, string[]> = {};
  const addFile = (bucket: string, path: string | null | undefined) => {
    if (path) (byBucket[bucket] ??= []).push(path);
  };
  addFile("generated-pdfs", oq.certificate_pdf_path);
  addFile("generated-pdfs", oq.signed_certificate_pdf_path);
  for (const row of ndtRows ?? []) addFile("ndt-reports", row.report_pdf_path);
  for (const row of valRows ?? [])
    addFile("ndt-reports", row.supporting_doc_path);

  for (const [bucket, paths] of Object.entries(byBucket)) {
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }

  const { error } = await supabase
    .from("operator_qualifications")
    .delete()
    .eq("id", oqId)
    .eq("org_id", org.id)
    .eq("operator_id", operatorId);

  if (error) throw new Error(error.message);

  revalidatePath(`/operators/${operatorId}`);
  revalidatePath("/operators");
  revalidatePath("/operators/masterlist");
  redirect(`/operators/${operatorId}`);
}

export async function deleteOperatorValidation(
  operatorId: string,
  validationId: string,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: rec } = await supabase
    .from("operator_validations")
    .select("id, supporting_doc_path")
    .eq("id", validationId)
    .eq("org_id", org.id)
    .single();

  if (!rec) throw new Error("Log entry not found.");

  if (rec.supporting_doc_path) {
    await supabase.storage
      .from("ndt-reports")
      .remove([rec.supporting_doc_path]);
  }

  const { error } = await supabase
    .from("operator_validations")
    .delete()
    .eq("id", validationId)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/operators/${operatorId}`);
}

export async function saveOperatorValidation(
  operatorId: string,
  oqId: string,
  formData: FormData,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: oqRow } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("id", oqId)
    .eq("org_id", org.id)
    .eq("operator_id", operatorId)
    .single();
  if (!oqRow) throw new Error("Qualification not found.");
  const oq = oqRow as OperatorQualification;

  const validatedOn =
    str(formData.get("validated_on")) ?? new Date().toISOString().slice(0, 10);
  const kind = (str(formData.get("kind")) ?? "continuity") as ValidationKind;
  const validatorName = str(formData.get("validator_name"));
  const note = str(formData.get("note"));

  const doc = formData.get("supporting_doc");
  const docPath = await uploadFile(
    "ndt-reports",
    doc instanceof File ? doc : null,
    `${org.id}/oq-${oqId}/validations`,
  );

  let newExpiry = oq.expiry_date;
  if (kind === "revalidation") {
    newExpiry = computeOperatorRevalidationExpiry(
      validatedOn,
      oq.revalidation_method as OperatorRevalidationMethod,
    );
  }

  const { error: insertError } = await supabase
    .from("operator_validations")
    .insert({
      org_id: org.id,
      oq_id: oqId,
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
    .from("operator_qualifications")
    .update({
      continuity_last_verified:
        kind === "continuity" || kind === "revalidation"
          ? validatedOn
          : oq.continuity_last_verified,
      expiry_date: newExpiry,
      certificate_pdf_path: null,
      oq_status:
        newExpiry && new Date(newExpiry) > new Date() ? "Approved" : oq.oq_status,
    })
    .eq("id", oqId)
    .eq("org_id", org.id);
  if (updateError) {
    throw new Error(`Could not update qualification: ${updateError.message}`);
  }

  revalidatePath(`/operators/${operatorId}`);
}

export async function setOperatorQualificationActive(
  operatorId: string,
  oqId: string,
  isActive: boolean,
) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("operator_qualifications")
    .update({ is_active: isActive })
    .eq("id", oqId)
    .eq("operator_id", operatorId)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/operators/${operatorId}`);
}
