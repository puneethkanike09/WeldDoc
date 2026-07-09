import type { Tr20172Material } from "./tr20172";
import * as tr20172 from "./tr20172";
import type { Tr20173Material } from "./tr20173";
import * as tr20173 from "./tr20173";

export type MaterialLookupSource = "TR20172" | "TR20173" | "Others";

export const MATERIAL_LOOKUP_OPTIONS: {
  value: MaterialLookupSource;
  label: string;
  hint: string;
}[] = [
  {
    value: "TR20172",
    label: "CEN ISO/TR 20172 — European materials",
    hint: "EN material standards (e.g. EN 10025-2, EN 10028-2)",
  },
  {
    value: "TR20173",
    label: "ISO/TR 20173 — American materials",
    hint: "ASTM, ASME, API, ABS, CSA, AS/NZS, …",
  },
  {
    value: "Others",
    label: "Others — not listed in TR 20172 / TR 20173",
    hint: "Enter material standard, grade and parent group manually.",
  },
];

export interface MaterialGradeOption {
  source: MaterialLookupSource;
  designation: string;
  label: string;
  group: string;
}

export function inferMaterialLookupSource(
  standard: string,
): MaterialLookupSource | "" {
  const norm = standard.trim();
  if (!norm) return "";
  if (tr20172.listGradesForStandard(norm).length > 0) return "TR20172";
  if (tr20173.listGradesForStandard(norm).length > 0) return "TR20173";
  return "Others";
}

export function isManualMaterialLookup(
  source: MaterialLookupSource | "",
): boolean {
  return source === "Others";
}

export function listMaterialStandards(
  source: MaterialLookupSource,
): string[] {
  if (source === "Others") return [];
  return source === "TR20172"
    ? tr20172.listMaterialStandards()
    : tr20173.listMaterialStandards();
}

export function listGradesForStandard(
  source: MaterialLookupSource,
  standard: string,
): MaterialGradeOption[] {
  if (source === "Others") return [];
  if (source === "TR20172") {
    return tr20172.listGradesForStandard(standard).map((m) => ({
      source: "TR20172" as const,
      designation: m.designation,
      label: m.number ? `${m.designation} (${m.number})` : m.designation,
      group: m.group,
    }));
  }

  return tr20173.listGradesForStandard(standard).map((m) => ({
    source: "TR20173" as const,
    designation: m.designation,
    label: m.designation,
    group: m.group,
  }));
}

export function lookupMaterialGroup(
  designation: string,
  standard?: string,
  source?: MaterialLookupSource,
): {
  source: MaterialLookupSource;
  trGroup: string;
  iso9606Group: string;
  material: Tr20172Material | Tr20173Material;
} | null {
  const resolved =
    source ?? (standard ? inferMaterialLookupSource(standard) : "");

  if (resolved === "Others") return null;

  if (resolved === "TR20172") {
    const eu = tr20172.lookupMaterialGroup(designation, standard);
    return eu ? { source: "TR20172", ...eu } : null;
  }

  if (resolved === "TR20173") {
    const us = tr20173.lookupMaterialGroup(designation, standard);
    return us ? { source: "TR20173", ...us } : null;
  }

  const eu = tr20172.lookupMaterialGroup(designation, standard);
  if (eu) return { source: "TR20172", ...eu };
  const us = tr20173.lookupMaterialGroup(designation, standard);
  if (us) return { source: "TR20173", ...us };
  return null;
}
