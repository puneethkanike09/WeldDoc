"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { commitValidatedImport } from "@/lib/welders/bulk-import/commit";
import { rowsToRawImport } from "@/lib/welders/bulk-import/display";
import { extractImportAssetsFromFormData } from "@/lib/welders/bulk-import/extract-upload";
// Phase 2 docs temporarily disabled:
// import { planImportDocuments } from "@/lib/welders/bulk-import/match-import-docs";
// import { uploadImportDocPlan } from "@/lib/welders/bulk-import/upload-import-docs";
import {
  matchPhotosToWelders,
  type PhotoFile,
} from "@/lib/welders/bulk-import/match-import-photos";
import type { ValidatedImportRow } from "@/lib/welders/bulk-import/types";
import { validateWelderImportUpload } from "@/lib/welders/bulk-import/validate-upload";
import { validateParsedImport } from "@/lib/welders/bulk-import/validate";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { uploadFile } from "@/lib/storage";
import { redisConfigured } from "@/lib/queue/redis";
import { enqueueWelderImport } from "@/lib/queue/welder-import-queue";

export type CommitWelderImportResult = {
  weldersCreated: number;
  qualificationsCreated: number;
  /** Present when commit was queued for background processing. */
  importJobId?: string;
  queued?: boolean;
};

export async function validateWelderImport(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const file = formData.get("file");
  return validateWelderImportUpload(
    file instanceof File ? file : null,
    org.id,
    supabase,
  );
}

function photoFileAsUpload(photo: PhotoFile): File {
  return new File([Uint8Array.from(photo.bytes)], photo.filename, {
    type: photo.mime,
  });
}

export async function commitWelderImport(
  formData: FormData,
): Promise<CommitWelderImportResult> {
  const rowsRaw = formData.get("rows");
  if (typeof rowsRaw !== "string" || !rowsRaw.trim()) {
    throw new Error("Missing import rows.");
  }

  let rows: ValidatedImportRow[];
  try {
    rows = JSON.parse(rowsRaw) as ValidatedImportRow[];
  } catch {
    throw new Error("Invalid import rows payload.");
  }

  if (!rows.length) {
    throw new Error("Nothing to import.");
  }

  const { org, userId } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("welders")
    .select("welder_id, id_number")
    .eq("org_id", org.id);

  const existingPlantIds = new Set(
    (existing ?? [])
      .map((w) => normalizePlantWelderId(w.welder_id))
      .filter((id): id is string => Boolean(id)),
  );

  const existingIdNumbers = (existing ?? [])
    .map((w) => w.id_number)
    .filter((id): id is string => Boolean(id?.trim()));

  const revalidation = validateParsedImport(rowsToRawImport(rows), existingPlantIds, {
    existingIdNumbers,
    welderSeq: org.welder_seq,
  });

  if (!revalidation.ok) {
    throw new Error(
      revalidation.errors[0]?.message ??
        "Import data failed validation. Re-upload the file.",
    );
  }

  const assets = await extractImportAssetsFromFormData(formData);
  const { matches: photoMatches } = matchPhotosToWelders(
    revalidation.rows,
    assets.photos,
  );

  // Phase 2 docs temporarily disabled — Excel + photos only.
  // const plantIds = ...
  // const docPlan = planImportDocuments(...)
  // const { paths: uploadedDocs } = await uploadImportDocPlan(org.id, docPlan);

  // Prefer background commit when Redis is configured.
  if (redisConfigured()) {
    const photoPaths: Record<string, string> = {};
    for (const [plantId, photo] of photoMatches) {
      const path = await uploadFile(
        "welder-photos",
        photoFileAsUpload(photo),
        org.id,
      );
      if (path) photoPaths[plantId] = path;
    }

    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .insert({
        org_id: org.id,
        created_by: userId,
        status: "queued",
        progress: 0,
        payload: {
          rows: revalidation.rows,
          photoPaths,
          // docPaths: uploadedDocs,
        },
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      throw new Error(jobErr?.message ?? "Could not create import job.");
    }

    await enqueueWelderImport({
      importJobId: job.id,
      orgId: org.id,
      userId,
      orgName: org.name,
      orgLocation: org.location_code,
      welderSeq: org.welder_seq,
    });

    return {
      weldersCreated: 0,
      qualificationsCreated: 0,
      importJobId: job.id,
      queued: true,
    };
  }

  const result = await commitValidatedImport(
    supabase,
    {
      orgId: org.id,
      userId,
      orgName: org.name,
      orgLocation: org.location_code,
      welderSeq: org.welder_seq,
    },
    revalidation.rows,
    photoMatches,
    undefined,
    // uploadedDocs — Phase 2 disabled
  );

  revalidatePath("/welders");
  revalidatePath("/dashboard");
  revalidatePath("/welders/masterlist");

  return result;
}
