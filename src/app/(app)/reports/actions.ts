"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { computeRange } from "@/lib/range-engine/iso9606";
import { computeExpiry } from "@/lib/expiry";
import type {
  JointCategory,
  ProductType,
  RevalidationMethod,
} from "@/types/db";

interface ReportRow {
  welderId: string;
  process: string;
  product: ProductType;
  position: string;
  materialGroup: string;
  materialGrade: string;
  dimensions: string;
  testThickness: number | null;
  pipeOd: number | null;
  visualResult: "Pass" | "Fail";
  mainResult: "Pass" | "Fail" | "NA";
}

function s(v: FormDataEntryValue | null): string | null {
  const t = typeof v === "string" ? v.trim() : "";
  return t.length ? t : null;
}

export async function createReport(formData: FormData) {
  const { org, userId } = await requireSession();
  const supabase = await createClient();

  const category = (s(formData.get("joint_category")) ?? "BW") as JointCategory;
  const testDate = s(formData.get("test_date")) ?? new Date().toISOString().slice(0, 10);
  const wpsNo = s(formData.get("wps_no"));
  if (!wpsNo) throw new Error("WPS number is required.");
  const manufacturerId = s(formData.get("manufacturer_signatory_id"));
  const examiningId = s(formData.get("examining_body_signatory_id"));
  const remarks = s(formData.get("remarks"));
  const method = (s(formData.get("revalidation_method")) ?? "9.3b") as RevalidationMethod;

  let rows: ReportRow[] = [];
  try {
    rows = JSON.parse((s(formData.get("rows")) ?? "[]") as string);
  } catch {
    rows = [];
  }
  if (rows.length === 0) throw new Error("Add at least one welder to the report.");

  // Examiner name for the WPQ records.
  let examinerName: string | null = null;
  if (examiningId) {
    const { data } = await supabase
      .from("signatories")
      .select("name")
      .eq("id", examiningId)
      .single();
    examinerName = data?.name ?? null;
  }

  const { data: reportNumber, error: rnErr } = await supabase.rpc(
    "next_report_number",
    { p_org: org.id, p_category: category },
  );
  if (rnErr || !reportNumber)
    throw new Error(rnErr?.message ?? "Could not allocate report number.");

  const { data: report, error: repErr } = await supabase
    .from("qualification_test_reports")
    .insert({
      org_id: org.id,
      report_number: reportNumber,
      joint_category: category,
      test_date: testDate,
      wps_no: wpsNo,
      manufacturer_signatory_id: manufacturerId,
      examining_body_signatory_id: examiningId,
      remarks,
      created_by: userId,
    })
    .select("id")
    .single();
  if (repErr) throw new Error(repErr.message);

  for (const row of rows) {
    const range = computeRange({
      jointType: category,
      product: row.product,
      testThicknessMm: row.testThickness,
      depositedThicknessMm: category === "FW" ? row.testThickness : null,
      pipeOdMm: row.pipeOd,
      position: row.position,
      materialGroup: row.materialGroup,
    });

    const allPass = row.visualResult === "Pass" && row.mainResult !== "Fail";

    const { data: wpq, error: wpqErr } = await supabase
      .from("qualification_records")
      .insert({
        org_id: org.id,
        welder_id: row.welderId,
        report_id: report.id,
        standard: "ISO_9606_1",
        process: row.process,
        joint_type: category,
        product: row.product,
        position: row.position,
        base_material_group: row.materialGroup,
        material_grade: row.materialGrade,
        dimensions: row.dimensions,
        test_thickness_mm: row.testThickness,
        deposited_thickness_mm: category === "FW" ? row.testThickness : null,
        pipe_od_mm: row.pipeOd,
        wps_reference: wpsNo,
        examiner_name: examinerName,
        date_of_welding: testDate,
        revalidation_method: method,
        wpq_status: allPass ? "Approved" : "Failed",
        certificate_issued_date: allPass ? testDate : null,
        continuity_last_verified: allPass ? testDate : null,
        expiry_date: allPass ? computeExpiry(method, testDate) : null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (wpqErr) throw new Error(wpqErr.message);

    await supabase.from("ranges_of_approval").upsert(
      {
        wpq_id: wpq.id,
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

    const ndtRows =
      category === "BW"
        ? [
            { test_method: "Visual (Root)", result: row.visualResult },
            { test_method: "Visual (Cap)", result: row.visualResult },
            { test_method: "RT/UT", result: row.mainResult },
          ]
        : [
            { test_method: "Visual (Root)", result: row.visualResult },
            { test_method: "Fracture Test", result: row.mainResult },
          ];

    for (const t of ndtRows) {
      await supabase.from("ndt_dt_records").insert({
        org_id: org.id,
        wpq_id: wpq.id,
        test_method: t.test_method,
        result: t.result,
        test_date: testDate,
      });
    }
  }

  revalidatePath("/reports");
  redirect(`/reports/${report.id}`);
}
