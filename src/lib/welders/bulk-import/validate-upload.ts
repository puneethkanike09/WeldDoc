import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { parseImportWorkbook } from "./parse";
import type {
  ImportValidationError,
  ImportValidationSummary,
  ValidatedImportRow,
} from "./types";
import { validateParsedImport } from "./validate";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ValidateUploadResult = {
  ok: boolean;
  fileError: string | null;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  summary: ImportValidationSummary;
};

function emptyResult(fileError: string): ValidateUploadResult {
  return {
    ok: false,
    fileError,
    rows: [],
    errors: [],
    summary: {
      totalRows: 0,
      welderCount: 0,
      qualificationCount: 0,
      errorCount: 0,
    },
  };
}

export async function validateWelderImportUpload(
  file: File | null,
  orgId: string,
  supabase: SupabaseClient,
): Promise<ValidateUploadResult> {
  if (!file || file.size === 0) {
    return emptyResult("Select an Excel file to upload.");
  }

  if (file.size > MAX_FILE_BYTES) {
    return emptyResult("File is too large (max 5 MB).");
  }

  const buffer = await file.arrayBuffer();
  const { rows: parsed, fileError } = parseImportWorkbook(buffer);

  if (fileError) {
    return emptyResult(fileError);
  }

  const { data: existing } = await supabase
    .from("welders")
    .select("welder_id, id_number")
    .eq("org_id", orgId);

  const existingPlantIds = (existing ?? [])
    .map((w) => normalizePlantWelderId(w.welder_id))
    .filter((id): id is string => Boolean(id));

  const existingIdNumbers = (existing ?? [])
    .map((w) => w.id_number)
    .filter((id): id is string => Boolean(id?.trim()));

  const { data: org } = await supabase
    .from("organizations")
    .select("welder_seq")
    .eq("id", orgId)
    .single();

  const result = validateParsedImport(parsed, existingPlantIds, {
    existingIdNumbers,
    welderSeq: org?.welder_seq ?? 0,
  });

  return {
    ok: result.ok,
    fileError: null,
    rows: result.rows,
    errors: result.errors,
    summary: result.summary,
  };
}
