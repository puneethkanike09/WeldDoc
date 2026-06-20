import steelEntries from "./tr20172-steel.json";

export interface Tr20172Material {
  designation: string;
  number: string;
  group: string;
  standards: string[];
}

const ENTRIES = steelEntries as Tr20172Material[];

/** ISO 9606-1 parent material group (1–11) from TR 20172 sub-group e.g. 1.2 → 1. */
export function iso9606GroupFromTrGroup(trGroup: string): string {
  const major = trGroup.split(".")[0];
  return major || trGroup;
}

export function listMaterialStandards(): string[] {
  const specs = new Set<string>();
  for (const e of ENTRIES) {
    for (const s of e.standards) specs.add(s);
  }
  return [...specs].sort();
}

export function listGradesForStandard(standard: string): Tr20172Material[] {
  const norm = standard.trim();
  return ENTRIES.filter((e) =>
    e.standards.some((s) => s.toLowerCase() === norm.toLowerCase()),
  ).sort((a, b) => a.designation.localeCompare(b.designation));
}

export function lookupByDesignation(
  designation: string,
  standard?: string,
): Tr20172Material | null {
  const q = designation.trim().toUpperCase();
  const matches = ENTRIES.filter(
    (e) => e.designation.toUpperCase() === q,
  );
  if (!matches.length) return null;
  if (standard) {
    const spec = standard.trim();
    return (
      matches.find((e) =>
        e.standards.some((s) => s.toLowerCase() === spec.toLowerCase()),
      ) ?? matches[0]
    );
  }
  return matches[0];
}

export function searchMaterials(query: string, limit = 12): Tr20172Material[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const hits: Tr20172Material[] = [];
  for (const e of ENTRIES) {
    if (
      e.designation.toUpperCase().includes(q) ||
      e.number.includes(q) ||
      e.standards.some((s) => s.toUpperCase().includes(q))
    ) {
      hits.push(e);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

export function lookupMaterialGroup(
  designation: string,
  standard?: string,
): { trGroup: string; iso9606Group: string; material: Tr20172Material } | null {
  const material = lookupByDesignation(designation, standard);
  if (!material) return null;
  return {
    trGroup: material.group,
    iso9606Group: iso9606GroupFromTrGroup(material.group),
    material,
  };
}
