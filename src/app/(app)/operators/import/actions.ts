"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { parseOperatorImportWorkbook } from "@/lib/operators/bulk-import/parse";
import { validateOperatorParsedImport } from "@/lib/operators/bulk-import/validate";
import { commitOperatorImport } from "@/lib/operators/bulk-import/commit";
import { normalizePlantOperatorId } from "@/lib/operators/plant-id";
import type { ValidatedOperatorImportRow } from "@/lib/operators/bulk-import/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const emptySummary = {
  totalRows: 0,
  operatorCount: 0,
  qualificationCount: 0,
  errorCount: 0,
};

export async function validateOperatorImport(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, fileError: "Select an Excel file.", rows: [], errors: [], summary: emptySummary };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, fileError: "File too large (max 5 MB).", rows: [], errors: [], summary: emptySummary };
  }

  const { rows: parsed, fileError } = parseOperatorImportWorkbook(await file.arrayBuffer());
  if (fileError) {
    return { ok: false, fileError, rows: [], errors: [], summary: emptySummary };
  }

  const { data: existing } = await supabase
    .from("operators")
    .select("operator_id")
    .eq("org_id", org.id);

  const existingPlantIds = new Set(
    (existing ?? [])
      .map((o) => normalizePlantOperatorId(o.operator_id))
      .filter((id): id is string => Boolean(id)),
  );

  const result = validateOperatorParsedImport(parsed, existingPlantIds);
  return { ...result, fileError: null };
}

export async function commitOperatorImportAction(rows: ValidatedOperatorImportRow[]) {
  if (!rows.length) throw new Error("Nothing to import.");
  const { org, userId } = await requireSession();
  const supabase = await createClient();
  const result = await commitOperatorImport(
    supabase,
    { orgId: org.id, userId, orgName: org.name, orgLocation: org.location_code },
    rows,
  );
  revalidatePath("/operators");
  return result;
}
