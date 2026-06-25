import steelEntries from "./tr20173-steel.json";

export interface Tr20173Material {
  /** Table 1 — Standard column (e.g. ASTM/ASME, API). */
  standard: string;
  /** Specification column (e.g. A/SA). */
  specification: string;
  /** No. column (e.g. 31). */
  number: string;
  /** Type/Grade column (e.g. B). */
  typeGrade: string;
  /** UNS when present. */
  uns: string;
  /** Specification + No. + Type/Grade — Grade / designation field. */
  designation: string;
  /** ISO/TR 15608:2017 Group — parent grouping for ISO 9606-1 range. */
  group: string;
  americanGroup: string;
  pNo: string;
  composition: string;
}

const ENTRIES = steelEntries as Tr20173Material[];

/** ISO 9606-1 parent material group (1–11) from ISO/TR 15608 sub-group e.g. 1.2 → 1. */
export function iso9606GroupFromTrGroup(trGroup: string): string {
  const major = trGroup.split(".")[0];
  return major || trGroup;
}

export function listMaterialStandards(): string[] {
  const specs = new Set<string>();
  for (const e of ENTRIES) specs.add(e.standard);
  return [...specs].sort();
}

export function listGradesForStandard(standard: string): Tr20173Material[] {
  const norm = standard.trim();
  return ENTRIES.filter((e) => e.standard.toLowerCase() === norm.toLowerCase()).sort(
    (a, b) => a.designation.localeCompare(b.designation),
  );
}

export function lookupByDesignation(
  designation: string,
  standard?: string,
): Tr20173Material | null {
  const q = designation.trim();
  const matches = ENTRIES.filter((e) => e.designation === q);
  if (!matches.length) return null;
  if (standard) {
    const spec = standard.trim();
    return (
      matches.find((e) => e.standard.toLowerCase() === spec.toLowerCase()) ??
      matches[0]
    );
  }
  return matches[0];
}

export function lookupMaterialGroup(
  designation: string,
  standard?: string,
): {
  trGroup: string;
  iso9606Group: string;
  material: Tr20173Material;
} | null {
  const material = lookupByDesignation(designation, standard);
  if (!material) return null;
  return {
    trGroup: material.group,
    iso9606Group: iso9606GroupFromTrGroup(material.group),
    material,
  };
}
