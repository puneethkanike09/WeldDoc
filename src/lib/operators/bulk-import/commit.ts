import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NDT_RESULT_COLUMN_BY_METHOD,
} from "./columns";
import {
  TESTING_STANDARD,
  requiredNdtTests,
} from "@/lib/iso14732/constants";
import { recomputeOperatorRange } from "@/lib/iso14732/recompute-operator-range";
import {
  assertPlantOperatorIdAvailable,
  isUniqueViolation,
  normalizePlantOperatorId,
} from "@/lib/operators/plant-id";
import type { ValidatedOperatorImportRow } from "./types";
import type { OperatorQualification, TestResult } from "@/types/db";

export interface CommitOperatorImportContext {
  orgId: string;
  userId: string;
  orgName: string;
  orgLocation: string | null;
}

export interface CommitOperatorImportResult {
  operatorsCreated: number;
  qualificationsCreated: number;
}

function operatorGroupKey(
  operator: ValidatedOperatorImportRow["operator"],
): string {
  if (operator.plantOperatorId) return operator.plantOperatorId;
  return `__auto:${[
    operator.fullName,
    operator.dateOfBirth,
    operator.placeOfBirth,
    operator.idMethod,
    operator.idNumber,
    operator.operatorStatus,
  ].join("|")}`;
}

export async function commitOperatorImport(
  supabase: SupabaseClient,
  ctx: CommitOperatorImportContext,
  rows: ValidatedOperatorImportRow[],
): Promise<CommitOperatorImportResult> {
  const operatorIdByGroup = new Map<string, string>();
  const operatorHasQual = new Map<string, boolean>();
  const createdOperatorIds: string[] = [];
  const createdOqIds: string[] = [];

  async function rollback() {
    for (const oqId of createdOqIds) {
      await supabase.from("operator_qualifications").delete().eq("id", oqId);
    }
    for (const operatorId of createdOperatorIds) {
      await supabase.from("operators").delete().eq("id", operatorId);
    }
  }

  try {
    for (const row of rows) {
      if (row.qualification) {
        operatorHasQual.set(operatorGroupKey(row.operator), true);
      }
    }

    const uniqueOperators = new Map<
      string,
      ValidatedOperatorImportRow["operator"]
    >();
    for (const row of rows) {
      const key = operatorGroupKey(row.operator);
      if (!uniqueOperators.has(key)) {
        uniqueOperators.set(key, row.operator);
      }
    }

    // Map existing operators in this org by their (normalized) plant/operator ID
    // so imported qualifications attach to the right person instead of failing.
    const { data: existingOperators, error: existingErr } = await supabase
      .from("operators")
      .select("id, operator_id")
      .eq("org_id", ctx.orgId);
    if (existingErr) {
      throw new Error(`Could not load existing operators: ${existingErr.message}`);
    }
    const existingIdByPlant = new Map<string, string>();
    for (const o of existingOperators ?? []) {
      const norm = normalizePlantOperatorId(o.operator_id);
      if (norm) existingIdByPlant.set(norm, o.id);
    }

    let operatorsCreated = 0;

    for (const [groupKey, operator] of uniqueOperators) {
      const plantOperatorId =
        normalizePlantOperatorId(operator.plantOperatorId) ??
        operator.plantOperatorId;

      const existingId = existingIdByPlant.get(plantOperatorId);
      if (existingId) {
        operatorIdByGroup.set(groupKey, existingId);
        continue;
      }

      await assertPlantOperatorIdAvailable(supabase, ctx.orgId, plantOperatorId);

      const { data: created, error } = await supabase
        .from("operators")
        .insert({
          org_id: ctx.orgId,
          operator_id: plantOperatorId,
          full_name: operator.fullName,
          date_of_birth: operator.dateOfBirth,
          place_of_birth: operator.placeOfBirth,
          id_method: operator.idMethod,
          id_number: operator.idNumber,
          employer: ctx.orgName,
          branch_location: ctx.orgLocation,
          status: operator.operatorStatus,
          is_new_operator: !operatorHasQual.get(groupKey),
          created_by: ctx.userId,
        })
        .select("id")
        .single();

      if (error) {
        if (isUniqueViolation(error)) {
          throw new Error(
            `Plant operator ID "${plantOperatorId}" is already in use.`,
          );
        }
        throw new Error(
          `Failed to create operator ${plantOperatorId}: ${error.message}`,
        );
      }

      createdOperatorIds.push(created.id);
      existingIdByPlant.set(plantOperatorId, created.id);
      operatorIdByGroup.set(groupKey, created.id);
      operatorsCreated += 1;
    }

    let qualificationsCreated = 0;

    for (const row of rows) {
      const qual = row.qualification;
      if (!qual) continue;

      const operatorId = operatorIdByGroup.get(operatorGroupKey(row.operator));
      if (!operatorId) {
        throw new Error(
          `Internal error: missing operator for row ${row.excelRow}.`,
        );
      }

      const { data: oq, error: oqErr } = await supabase
        .from("operator_qualifications")
        .insert({
          org_id: ctx.orgId,
          operator_id: operatorId,
          standard: "ISO_14732",
          testing_standard: TESTING_STANDARD,
          date_of_welding: qual.dateOfWelding,
          welding_type: qual.weldingType,
          process: qual.process,
          product_type: qual.productType,
          joint_type: qual.jointType,
          welding_mode: qual.weldingMode,
          wps_reference: "IMPORT",
          employer_branch: ctx.orgLocation,
          functional_knowledge_ref: "IMPORT",
          welding_technology_knowledge: "Acceptable",
          examiner_ref: "IMPORT",
          examiner_name: qual.examinerName ?? "Imported",
          revalidation_method: qual.revalidationMethod,
          qualification_test_method: qual.qualificationTestMethod,
          method1_standard: qual.method1Standard,
          equipment_power_source: "IMPORT",
          equipment_unit_details: "Imported via bulk import",
          visual_or_remote_control: "Visual Control",
          automatic_joint_tracking: "NA",
          automatic_arc_length_control: "NA",
          single_multi_run: "NA",
          orbital_position: "NA",
          material_backing: "No",
          material_backing_type: null,
          consumable_insert: "NA",
          material_spec_info: "IMPORT",
          test_piece_dimensions_info: "IMPORT",
          filler_designation_info: "IMPORT",
          is_legacy: true,
          oq_status: qual.oqStatus,
          certificate_issued_date: qual.dateOfWelding,
          continuity_last_verified: qual.continuityLastVerified,
          expiry_date: qual.expiryDate,
        })
        .select("id")
        .single();

      if (oqErr) {
        throw new Error(
          `Failed to create qualification for row ${row.excelRow}: ${oqErr.message}`,
        );
      }

      createdOqIds.push(oq.id);
      await recomputeOperatorRange(oq.id);

      const oqShape = {
        qualification_test_method: qual.qualificationTestMethod,
        method1_standard: qual.method1Standard,
        welding_type: qual.weldingType,
        product_type: qual.productType,
        joint_type: qual.jointType,
        process: qual.process,
      } satisfies Pick<
        OperatorQualification,
        | "qualification_test_method"
        | "method1_standard"
        | "welding_type"
        | "product_type"
        | "joint_type"
        | "process"
      >;

      const tests = requiredNdtTests(oqShape);
      for (const t of tests) {
        const col = NDT_RESULT_COLUMN_BY_METHOD[t.method];
        const result = (col
          ? qual.ndtResults[col]
          : undefined) ?? (t.method === "VT" ? "Pass" : "NA");
        if (result === "NA") continue;

        const { error: ndtErr } = await supabase
          .from("operator_ndt_records")
          .insert({
            org_id: ctx.orgId,
            oq_id: oq.id,
            test_method: t.method,
            result: result as TestResult,
            test_date: qual.dateOfWelding,
            conducted_by: "IMPORT",
          });
        if (ndtErr) {
          throw new Error(
            `Failed to save NDT for row ${row.excelRow}: ${ndtErr.message}`,
          );
        }
      }

      qualificationsCreated += 1;
    }

    return {
      operatorsCreated,
      qualificationsCreated,
    };
  } catch (err) {
    await rollback();
    throw err;
  }
}
