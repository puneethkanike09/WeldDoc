import type { SupabaseClient } from "@supabase/supabase-js";
import { VISUAL_TEST_METHOD } from "@/lib/iso9606/constants";
import { resolveJointStorage } from "@/lib/iso9606/product-dimensions";
import { recomputeWpqRange } from "@/lib/iso9606/recompute-wpq-range";
import {
  assertPlantWelderIdAvailable,
  isUniqueViolation,
  normalizePlantWelderId,
  plantWelderIdFromUid,
} from "@/lib/welders/plant-id";
import type { ValidatedImportRow, WelderImportFields } from "./types";

export interface CommitImportContext {
  orgId: string;
  userId: string;
  orgName: string;
  orgLocation: string | null;
}

export interface CommitImportResult {
  weldersCreated: number;
  qualificationsCreated: number;
}

function welderGroupKey(welder: WelderImportFields): string {
  if (welder.plantWelderId) return welder.plantWelderId;
  return `__auto:${welderFingerprint(welder)}`;
}

function welderFingerprint(w: WelderImportFields): string {
  return [
    w.fullName,
    w.dateOfBirth,
    w.placeOfBirth,
    w.idMethod,
    w.idNumber,
    w.welderStatus,
  ].join("|");
}

export async function commitValidatedImport(
  supabase: SupabaseClient,
  ctx: CommitImportContext,
  rows: ValidatedImportRow[],
): Promise<CommitImportResult> {
  const welderIdByGroup = new Map<string, string>();
  const welderHasQual = new Map<string, boolean>();
  const createdWelderIds: string[] = [];
  const createdWpqIds: string[] = [];

  async function rollback() {
    for (const wpqId of createdWpqIds) {
      await supabase.from("qualification_records").delete().eq("id", wpqId);
    }
    for (const welderId of createdWelderIds) {
      await supabase.from("welders").delete().eq("id", welderId);
    }
  }

  try {
    for (const row of rows) {
      if (row.qualification) {
        welderHasQual.set(welderGroupKey(row.welder), true);
      }
    }

    const uniqueWelders = new Map<string, WelderImportFields>();
    for (const row of rows) {
      const key = welderGroupKey(row.welder);
      if (!uniqueWelders.has(key)) {
        uniqueWelders.set(key, row.welder);
      }
    }

    for (const [groupKey, welder] of uniqueWelders) {
      const { data: uid, error: uidErr } = await supabase.rpc("next_welder_uid", {
        p_org: ctx.orgId,
      });
      if (uidErr || !uid) {
        throw new Error(uidErr?.message ?? "Could not allocate welder UID.");
      }

      const plantWelderId =
        normalizePlantWelderId(welder.plantWelderId) ||
        plantWelderIdFromUid(uid as string);
      if (!plantWelderId) {
        throw new Error(`Could not assign plant ID for row group ${groupKey}.`);
      }

      await assertPlantWelderIdAvailable(supabase, ctx.orgId, plantWelderId);

      const { data: created, error } = await supabase
        .from("welders")
        .insert({
          org_id: ctx.orgId,
          uid,
          welder_id: plantWelderId,
          full_name: welder.fullName,
          date_of_birth: welder.dateOfBirth,
          place_of_birth: welder.placeOfBirth,
          id_method: welder.idMethod,
          id_number: welder.idNumber,
          employer: ctx.orgName,
          branch_location: ctx.orgLocation,
          photo_path: null,
          status: welder.welderStatus,
          is_new_welder: !welderHasQual.get(groupKey),
          created_by: ctx.userId,
        })
        .select("id")
        .single();

      if (error) {
        if (isUniqueViolation(error)) {
          throw new Error(
            `Plant welder ID "${plantWelderId}" is already in use. Remove duplicates or edit IDs in the preview table.`,
          );
        }
        throw new Error(
          `Failed to create welder ${plantWelderId}: ${error.message}`,
        );
      }

      createdWelderIds.push(created.id);
      welderIdByGroup.set(groupKey, created.id);
    }

    let qualificationsCreated = 0;

    for (const row of rows) {
      const qual = row.qualification;
      if (!qual) continue;

      const welderId = welderIdByGroup.get(welderGroupKey(row.welder));
      if (!welderId) {
        throw new Error(
          `Internal error: missing welder for row ${row.excelRow}.`,
        );
      }

      const legacyJoint = resolveJointStorage(qual.jointType);

      const { data: wpq, error: wpqErr } = await supabase
        .from("qualification_records")
        .insert({
          org_id: ctx.orgId,
          welder_id: welderId,
          standard: "ISO_9606_1",
          testing_standard: qual.testingStandard,
          process: qual.process,
          joint_type: legacyJoint.joint_type,
          joint_type_extended: legacyJoint.joint_type_extended,
          product: qual.product,
          position: qual.position,
          base_material_group: qual.baseMaterialGroup,
          filler_group: qual.fillerGroup,
          test_thickness_mm: qual.testThicknessMm,
          deposited_thickness_mm: qual.depositedThicknessMm,
          pipe_od_mm: qual.pipeOdMm,
          date_of_welding: qual.dateOfWelding,
          revalidation_method: qual.revalidationMethod,
          is_legacy: true,
          wpq_status: qual.wpqStatus,
          certificate_issued_date: qual.dateOfWelding,
          continuity_last_verified: qual.continuityLastVerified,
          expiry_date: qual.expiryDate,
          legacy_document_paths: [],
          job_knowledge: "Not tested",
        })
        .select("id")
        .single();

      if (wpqErr) {
        throw new Error(
          `Failed to create qualification for row ${row.excelRow}: ${wpqErr.message}`,
        );
      }

      createdWpqIds.push(wpq.id);
      await recomputeWpqRange(wpq.id, supabase);

      const ndtRows = [
        { method: VISUAL_TEST_METHOD, result: qual.resultVt },
        { method: "RT/UT", result: qual.resultRtUt },
        { method: "Fracture Test", result: qual.resultFracture },
      ] as const;

      for (const t of ndtRows) {
        if (t.result === "NA") continue;
        const { error: ndtErr } = await supabase.from("ndt_dt_records").insert({
          org_id: ctx.orgId,
          wpq_id: wpq.id,
          test_method: t.method,
          result: t.result,
          test_date: qual.dateOfWelding,
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
      weldersCreated: uniqueWelders.size,
      qualificationsCreated,
    };
  } catch (err) {
    await rollback();
    throw err;
  }
}
