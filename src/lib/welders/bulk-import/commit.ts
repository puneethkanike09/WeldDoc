import type { SupabaseClient } from "@supabase/supabase-js";
import { VISUAL_TEST_METHOD } from "@/lib/iso9606/constants";
import { resolveJointStorage } from "@/lib/iso9606/product-dimensions";
import { recomputeWpqRange } from "@/lib/iso9606/recompute-wpq-range";
import { uploadFile } from "@/lib/storage";
import {
  assertPlantWelderIdAvailable,
  isUniqueViolation,
  normalizePlantWelderId,
} from "@/lib/welders/plant-id";
import type { PhotoFile } from "./match-import-photos";
import type { ValidatedImportRow, WelderImportFields } from "./types";

export interface CommitImportContext {
  orgId: string;
  userId: string;
  orgName: string;
  orgLocation: string | null;
  welderSeq: number;
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

function photoFileAsUpload(photo: PhotoFile): File {
  return new File([Uint8Array.from(photo.bytes)], photo.filename, {
    type: photo.mime,
  });
}

export async function commitValidatedImport(
  supabase: SupabaseClient,
  ctx: CommitImportContext,
  rows: ValidatedImportRow[],
  photoMatches?: Map<string, PhotoFile>,
): Promise<CommitImportResult> {
  const welderIdByGroup = new Map<string, string>();
  const welderHasQual = new Map<string, boolean>();
  const createdWelderIds: string[] = [];
  const createdWpqIds: string[] = [];
  const uploadedPhotoPaths: string[] = [];

  async function rollback() {
    for (const wpqId of createdWpqIds) {
      await supabase.from("qualification_records").delete().eq("id", wpqId);
    }
    for (const welderId of createdWelderIds) {
      await supabase.from("welders").delete().eq("id", welderId);
    }
    if (uploadedPhotoPaths.length) {
      await supabase.storage.from("welder-photos").remove(uploadedPhotoPaths);
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

    // Map existing welders in this org by their (normalized) plant/welder ID so
    // imported qualifications attach to the right person instead of failing.
    const { data: existingWelders, error: existingErr } = await supabase
      .from("welders")
      .select("id, welder_id")
      .eq("org_id", ctx.orgId);
    if (existingErr) {
      throw new Error(`Could not load existing welders: ${existingErr.message}`);
    }
    const existingIdByPlant = new Map<string, string>();
    for (const w of existingWelders ?? []) {
      const norm = normalizePlantWelderId(w.welder_id);
      if (norm) existingIdByPlant.set(norm, w.id);
    }

    let weldersCreated = 0;

    for (const [groupKey, welder] of uniqueWelders) {
      const plantWelderId =
        normalizePlantWelderId(welder.plantWelderId) ?? welder.plantWelderId;

      // Attach to an existing welder with this plant ID.
      const existingId = existingIdByPlant.get(plantWelderId);
      if (existingId) {
        welderIdByGroup.set(groupKey, existingId);
        continue;
      }

      await assertPlantWelderIdAvailable(supabase, ctx.orgId, plantWelderId);

      let photoPath: string | null = null;
      const matchedPhoto = photoMatches?.get(plantWelderId);
      if (matchedPhoto) {
        photoPath = await uploadFile(
          "welder-photos",
          photoFileAsUpload(matchedPhoto),
          ctx.orgId,
        );
        if (photoPath) uploadedPhotoPaths.push(photoPath);
      }

      const { data: created, error } = await supabase
        .from("welders")
        .insert({
          org_id: ctx.orgId,
          welder_id: plantWelderId,
          full_name: welder.fullName,
          date_of_birth: welder.dateOfBirth,
          place_of_birth: welder.placeOfBirth,
          id_method: welder.idMethod,
          id_number: welder.idNumber,
          employer: ctx.orgName,
          branch_location: ctx.orgLocation,
          photo_path: photoPath,
          status: welder.welderStatus,
          is_new_welder: !welderHasQual.get(groupKey),
          created_by: ctx.userId,
        })
        .select("id")
        .single();

      if (error) {
        if (isUniqueViolation(error)) {
          throw new Error(
            `Plant welder ID "${plantWelderId}" is already in use. Remove duplicates in the file.`,
          );
        }
        throw new Error(
          `Failed to create welder ${plantWelderId}: ${error.message}`,
        );
      }

      createdWelderIds.push(created.id);
      existingIdByPlant.set(plantWelderId, created.id);
      welderIdByGroup.set(groupKey, created.id);
      weldersCreated += 1;
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

      if (qual.continuityLastVerified) {
        const { error: valErr } = await supabase
          .from("validation_records")
          .insert({
            org_id: ctx.orgId,
            wpq_id: wpq.id,
            validated_on: qual.continuityLastVerified,
            kind: "continuity",
            note: "Imported from legacy registry",
          });
        if (valErr) {
          throw new Error(
            `Failed to seed continuity for row ${row.excelRow}: ${valErr.message}`,
          );
        }
      }

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
      weldersCreated,
      qualificationsCreated,
    };
  } catch (err) {
    await rollback();
    throw err;
  }
}
