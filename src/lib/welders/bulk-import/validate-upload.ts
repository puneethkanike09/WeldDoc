import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import {
  matchPhotosToWelders,
  type PhotoFile,
  type PhotoMatchResult,
} from "./match-import-photos";
import { parseImportWorkbook } from "./parse";
import type {
  ImportValidationError,
  ImportValidationSummary,
  ImportWarning,
  ValidatedImportRow,
} from "./types";
import { validateParsedImport } from "./validate";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ValidateUploadResult = {
  ok: boolean;
  fileError: string | null;
  rows: ValidatedImportRow[];
  errors: ImportValidationError[];
  warnings: ImportWarning[];
  summary: ImportValidationSummary;
  photoResults: PhotoMatchResult[];
};

export function emptyValidateUploadResult(
  fileError: string,
): ValidateUploadResult {
  return {
    ok: false,
    fileError,
    rows: [],
    errors: [],
    warnings: [],
    summary: {
      totalRows: 0,
      welderCount: 0,
      existingWelderCount: 0,
      newWelderCount: 0,
      qualificationCount: 0,
      errorCount: 0,
    },
    photoResults: [],
  };
}

export async function validateWelderImportUpload(
  file: File | null,
  orgId: string,
  supabase: SupabaseClient,
  photos: PhotoFile[] = [],
): Promise<ValidateUploadResult> {
  if (!file || file.size === 0) {
    return emptyValidateUploadResult("Select an Excel file to upload.");
  }

  if (file.size > MAX_FILE_BYTES) {
    return emptyValidateUploadResult("File is too large (max 5 MB).");
  }

  const buffer = await file.arrayBuffer();
  const { rows: parsed, fileError } = parseImportWorkbook(buffer);

  if (fileError) {
    return emptyValidateUploadResult(fileError);
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

  const { results: photoResults } = matchPhotosToWelders(result.rows, photos);

  return {
    ok: result.ok,
    fileError: null,
    rows: result.rows,
    errors: result.errors,
    warnings: result.warnings,
    summary: result.summary,
    photoResults,
  };
}
