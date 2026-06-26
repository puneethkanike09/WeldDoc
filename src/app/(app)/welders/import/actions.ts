"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { commitValidatedImport } from "@/lib/welders/bulk-import/commit";
import { rowsToRawImport } from "@/lib/welders/bulk-import/display";
import type { ValidatedImportRow } from "@/lib/welders/bulk-import/types";
import { validateWelderImportUpload } from "@/lib/welders/bulk-import/validate-upload";
import { validateParsedImport } from "@/lib/welders/bulk-import/validate";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";

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

export async function commitWelderImport(rows: ValidatedImportRow[]) {
  if (!rows.length) {
    throw new Error("Nothing to import.");
  }

  const { org, userId } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("welders")
    .select("welder_id")
    .eq("org_id", org.id);

  const existingPlantIds = new Set(
    (existing ?? [])
      .map((w) => normalizePlantWelderId(w.welder_id))
      .filter((id): id is string => Boolean(id)),
  );

  const revalidation = validateParsedImport(
    rowsToRawImport(rows),
    existingPlantIds,
  );

  if (!revalidation.ok) {
    throw new Error(
      revalidation.errors[0]?.message ??
        "Import data failed validation. Re-upload the file.",
    );
  }

  const result = await commitValidatedImport(
    supabase,
    {
      orgId: org.id,
      userId,
      orgName: org.name,
      orgLocation: org.location_code,
    },
    revalidation.rows,
  );

  revalidatePath("/welders");
  revalidatePath("/dashboard");
  revalidatePath("/masterlist");

  return result;
}
