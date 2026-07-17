/**
 * Pure helpers: decide which storage paths attach to a WPQ / validation row.
 * Used by commit and unit-tested without Supabase.
 */
import {
  emptyImportDocPaths,
  plantIdFromDocFilename,
  type ImportDocPaths,
} from "./match-import-docs";

export type DocAttachmentForWpq = {
  signedCertificatePath: string | null;
  legacyDocumentPaths: string[];
  /** validatedOn → supporting_doc_path */
  supportingByDate: Record<string, string>;
};

function coercePlantId(plantWelderId: string): string {
  return (
    plantIdFromDocFilename(
      /\.[^.]+$/.test(plantWelderId)
        ? plantWelderId
        : `${plantWelderId}.pdf`,
    ) ?? plantWelderId
  );
}

export function resolveDocAttachmentForPlant(
  plantWelderId: string,
  docPaths: ImportDocPaths | undefined,
  validationDates: string[],
): DocAttachmentForWpq {
  const plant = coercePlantId(plantWelderId);
  const paths = docPaths ?? emptyImportDocPaths();

  const signedCertificatePath = paths.certificates[plant] ?? null;
  const legacyDocumentPaths = [...(paths.legacyByPlant[plant] ?? [])];

  const supportingByDate: Record<string, string> = {};
  const known = new Set(validationDates);

  for (const [key, path] of Object.entries(paths.continuityByDate)) {
    if (!key.startsWith(`${plant}|`)) continue;
    const date = key.slice(plant.length + 1);
    if (known.has(date)) {
      supportingByDate[date] = path;
    } else if (!legacyDocumentPaths.includes(path)) {
      // Dated file with no matching validation row → legacy fallback
      legacyDocumentPaths.push(path);
    }
  }

  return {
    signedCertificatePath,
    legacyDocumentPaths,
    supportingByDate,
  };
}
