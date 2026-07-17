/**
 * Match ZIP certificates/ and continuity/ files to welders / qualifications.
 */
import {
  formatPlantWelderId,
  normalizePlantWelderId,
} from "@/lib/welders/plant-id";

export const MAX_CONTINUITY_DOCS_PER_QUAL = 10;
export const MAX_DOC_BYTES = 15 * 1024 * 1024;

export type DocFile = {
  filename: string;
  bytes: Buffer;
  mime: string;
  /** Relative path inside ZIP, e.g. certificates/W#14.pdf */
  zipPath?: string;
};

export type CertificateMatchStatus =
  | "ready"
  | "missing"
  | "duplicate"
  | "invalid_type"
  | "too_large";

export type CertificateMatchResult = {
  plantWelderId: string;
  filename: string | null;
  status: CertificateMatchStatus;
};

export type ContinuityMatchBundle = {
  /** Dated files → validation_records.supporting_doc_path */
  byDate: Map<string, DocFile>; // key `${plantId}|${isoDate}`
  /** Undated numbered / leftover → legacy_document_paths (capped) */
  legacyByPlant: Map<string, DocFile[]>;
  warnings: string[];
};

export type ImportDocPlan = {
  certificateByPlant: Map<string, DocFile>;
  certificateResults: CertificateMatchResult[];
  continuityByDate: Map<string, DocFile>;
  legacyByPlant: Map<string, DocFile[]>;
  continuityWarnings: string[];
};

const PDF_MIME = "application/pdf";

function isPdf(file: DocFile): boolean {
  const lower = file.filename.toLowerCase();
  return lower.endsWith(".pdf") || file.mime === PDF_MIME;
}

/** Exact certificate name: W#14.pdf / W14.pdf / W#014.pdf (no date/cont suffix). */
export function isCertificateFilename(filename: string): boolean {
  return /^W#?\d+\.pdf$/i.test(filename.trim());
}

/**
 * Leading plant id from W#14.pdf, W#14_2025-08-02.pdf, W#14_cont_1.pdf.
 */
export function plantIdFromDocFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/i, "").trim();
  const m = base.match(/^W#?(\d+)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  return formatPlantWelderId(n);
}

/** Extract YYYY-MM-DD from filename if present. */
export function continuityDateFromFilename(filename: string): string | null {
  const m = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!m) return null;
  const d = new Date(`${m[1]}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return m[1];
}

export function isNumberedContinuityFilename(filename: string): boolean {
  return /_cont[_\-]?\d+/i.test(filename.replace(/\.[^.]+$/i, ""));
}

/** Coerce spreadsheet / form plant ids to canonical W#02 form. */
function coercePlantId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  const fromDoc = plantIdFromDocFilename(
    /\.[^.]+$/.test(trimmed) ? trimmed : `${trimmed}.pdf`,
  );
  if (fromDoc) return fromDoc;
  return normalizePlantWelderId(trimmed);
}

function uniquePlantIds(plantWelderIds: string[]): string[] {
  return [
    ...new Set(
      plantWelderIds
        .map((id) => coercePlantId(id))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

/**
 * Match certificates/{W#}.pdf → one file per plant ID.
 * Only exact W#NN.pdf names count (dated/cont names are ignored here).
 */
export function matchCertificatesToWelders(
  plantWelderIds: string[],
  files: DocFile[],
): { matches: Map<string, DocFile>; results: CertificateMatchResult[] } {
  const uniquePlants = uniquePlantIds(plantWelderIds);

  const byPlant = new Map<string, DocFile[]>();
  for (const f of files) {
    if (!isCertificateFilename(f.filename)) continue;
    const plant = plantIdFromDocFilename(f.filename);
    if (!plant) continue;
    const list = byPlant.get(plant) ?? [];
    list.push(f);
    byPlant.set(plant, list);
  }

  const matches = new Map<string, DocFile>();
  const results: CertificateMatchResult[] = [];

  for (const plantId of uniquePlants) {
    const candidates = byPlant.get(plantId) ?? [];
    if (candidates.length === 0) {
      results.push({ plantWelderId: plantId, filename: null, status: "missing" });
      continue;
    }
    if (candidates.length > 1) {
      results.push({
        plantWelderId: plantId,
        filename: null,
        status: "duplicate",
      });
      continue;
    }
    const f = candidates[0];
    if (!isPdf(f)) {
      results.push({
        plantWelderId: plantId,
        filename: f.filename,
        status: "invalid_type",
      });
      continue;
    }
    if (f.bytes.length > MAX_DOC_BYTES) {
      results.push({
        plantWelderId: plantId,
        filename: f.filename,
        status: "too_large",
      });
      continue;
    }
    matches.set(plantId, f);
    results.push({
      plantWelderId: plantId,
      filename: f.filename,
      status: "ready",
    });
  }

  return { matches, results };
}

/**
 * Match continuity docs to plant IDs; dated files keyed for validation rows.
 * Max MAX_CONTINUITY_DOCS_PER_QUAL (dated + legacy) per plant; warn + skip extras.
 */
export function matchContinuityDocsToWelders(
  plantWelderIds: string[],
  files: DocFile[],
): ContinuityMatchBundle {
  const plantSet = new Set(uniquePlantIds(plantWelderIds));

  const byDate = new Map<string, DocFile>();
  const legacyByPlant = new Map<string, DocFile[]>();
  const warnings: string[] = [];
  const countByPlant = new Map<string, number>();

  // Preserve input order so "first file wins" on duplicate dates.
  for (const f of files) {
    const plant = plantIdFromDocFilename(f.filename);
    if (!plant || !plantSet.has(plant)) {
      warnings.push(`Continuity file ignored (unknown W#): ${f.filename}`);
      continue;
    }
    if (!isPdf(f)) {
      warnings.push(`Continuity file ignored (not PDF): ${f.filename}`);
      continue;
    }
    if (f.bytes.length > MAX_DOC_BYTES) {
      warnings.push(`Continuity file too large (max 15 MB): ${f.filename}`);
      continue;
    }

    const used = countByPlant.get(plant) ?? 0;
    if (used >= MAX_CONTINUITY_DOCS_PER_QUAL) {
      warnings.push(
        `Continuity docs capped at ${MAX_CONTINUITY_DOCS_PER_QUAL} for ${plant}; skipped ${f.filename}`,
      );
      continue;
    }

    const iso = continuityDateFromFilename(f.filename);
    if (iso) {
      const key = `${plant}|${iso}`;
      if (byDate.has(key)) {
        warnings.push(
          `Duplicate continuity date ${iso} for ${plant}; keeping first, skipped ${f.filename}`,
        );
        continue;
      }
      byDate.set(key, f);
      countByPlant.set(plant, used + 1);
      continue;
    }

    const list = legacyByPlant.get(plant) ?? [];
    list.push(f);
    legacyByPlant.set(plant, list);
    countByPlant.set(plant, used + 1);
  }

  return { byDate, legacyByPlant, warnings };
}

/** Combine certificate + continuity matching for validate/commit. */
export function planImportDocuments(
  plantWelderIds: string[],
  certificates: DocFile[],
  continuity: DocFile[],
): ImportDocPlan {
  const { matches, results } = matchCertificatesToWelders(
    plantWelderIds,
    certificates,
  );
  const cont = matchContinuityDocsToWelders(plantWelderIds, continuity);
  return {
    certificateByPlant: matches,
    certificateResults: results,
    continuityByDate: cont.byDate,
    legacyByPlant: cont.legacyByPlant,
    continuityWarnings: cont.warnings,
  };
}

/** Pre-uploaded storage paths for background worker (no file bytes in Redis). */
export type ImportDocPaths = {
  certificates: Record<string, string>;
  continuityByDate: Record<string, string>;
  legacyByPlant: Record<string, string[]>;
};

export function emptyImportDocPaths(): ImportDocPaths {
  return {
    certificates: {},
    continuityByDate: {},
    legacyByPlant: {},
  };
}
