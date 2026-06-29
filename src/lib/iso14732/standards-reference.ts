/** ISO 14732:2025 — PDF reference anchors for in-app globe links. */
export const ISO_14732 = {
  title: "ISO 14732:2025",
  shortTitle: "ISO 14732:2025",
  fileName: "ISO 14732-2025 Operator.pdf",
  tables: {
    qualification: { page: 10, label: "Qualification — general (§4.1)" },
    weldingType: { page: 11, label: "Fusion welding qualification (§4.2)" },
    resistanceWelding: { page: 12, label: "Resistance welding qualification (§4.3)" },
    process: { page: 12, label: "Welding process group — ISO 4063 (§5.1 a)" },
    weldingMode: { page: 9, label: "Mechanized & automatic welding (§3.1–3.2)" },
    productJoint: { page: 11, label: "Qualification test methods (§4.2)" },
    revalidation: { page: 13, label: "Revalidation of qualification (§6.3)" },
    functionalKnowledge: {
      page: 15,
      label: "Functional knowledge of the welding unit (Annex A)",
    },
    technologyKnowledge: {
      page: 16,
      label: "Knowledge of welding technology (Annex B)",
    },
    weldingEquipment: { page: 9, label: "Welding equipment (§3.8)" },
    weldingUnit: { page: 9, label: "Welding unit (§3.7)" },
    mechanizedVariables: { page: 12, label: "Mechanized welding variables (§5.1)" },
    automaticVariables: { page: 13, label: "Automatic welding variables (§5.2)" },
    qualificationTestMethods: {
      page: 11,
      label: "Qualification test methods & acceptance (§4.2)",
    },
    certificate: {
      page: 20,
      label: "Qualification test certificate example (Annex C)",
    },
    certificateRequirements: {
      page: 14,
      label: "Qualification test certificate (§7)",
    },
  },
} as const;

export type Iso14732TableKey = keyof typeof ISO_14732.tables;

export function iso14732PdfHref(page?: number): string {
  const base = "/api/standards/iso-14732";
  return page ? `${base}#page=${page}` : base;
}
