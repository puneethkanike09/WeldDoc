"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { commitValidatedImport } from "@/lib/welders/bulk-import/commit";
import { rowsToRawImport } from "@/lib/welders/bulk-import/display";
import { extractPhotosFromFormData } from "@/lib/welders/bulk-import/extract-upload";
import { matchPhotosToWelders } from "@/lib/welders/bulk-import/match-import-photos";
import type { ValidatedImportRow } from "@/lib/welders/bulk-import/types";
import { validateWelderImportUpload } from "@/lib/welders/bulk-import/validate-upload";
import { validateParsedImport } from "@/lib/welders/bulk-import/validate";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";

export type CommitWelderImportResult = {
  weldersCreated: number;
  qualificationsCreated: number;
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

  const photos = await extractPhotosFromFormData(formData);
  const { matches: photoMatches } = matchPhotosToWelders(
    revalidation.rows,
    photos,
  );

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
  );

  revalidatePath("/welders");
  revalidatePath("/dashboard");
  revalidatePath("/welders/masterlist");

  return result;
}
