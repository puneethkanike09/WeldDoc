/** EN ISO 9606-1:2017 — PDF reference anchors for in-app globe links. */
export const ISO_9606_1 = {
  title: "BS EN ISO 9606-1:2017",
  shortTitle: "EN ISO 9606-1:2017",
  fileName: "BS_EN_ISO_9606-1-2017.pdf",
  tables: {
    /** Table 1 — multi-process deposited thickness (maps to Table 6 per process). */
    multiProcessThickness: {
      page: 18,
      label: "Multi-process deposited thickness (Table 1)",
    },
    /** §5.2 — welding process qualification ranges (not a numbered table). */
    process: { page: 17, label: "Welding processes (§5.2)" },
    transferMode: { page: 17, label: "Transfer mode (§5.2)" },
    productType: { page: 18, label: "Product type — plate or pipe (§5.3)" },
    weldType: { page: 19, label: "Type of weld — butt or fillet (§5.4)" },
    supplementaryFillet: {
      page: 19,
      label: "Supplementary fillet weld test (§5.4 e)",
    },
    branchConnection: {
      page: 22,
      label: "Branch joints — Figure 1 & §5.7",
    },
    fillerGroup: { page: 19, label: "Filler material grouping (Table 2)" },
    fillerGroupRange: { page: 20, label: "Filler material qualification (Table 3)" },
    parentMaterial: {
      page: 20,
      label: "Parent material groups 1–11 (§5.5.2)",
    },
    fillerType111: { page: 20, label: "Covered electrode types (Table 4)" },
    fillerTypeOther: { page: 21, label: "Filler material types (Table 5)" },
    dimensions: { page: 21, label: "Test piece dimensions (§5.7)" },
    thicknessBw: { page: 21, label: "Deposited thickness — butt welds (Table 6)" },
    pipeOd: { page: 22, label: "Outside pipe diameter (Table 7)" },
    thicknessFw: { page: 22, label: "Material thickness — fillet welds (Table 8)" },
    positionBw: { page: 24, label: "Welding positions — butt welds (Table 9)" },
    positionFw: { page: 24, label: "Welding positions — fillet welds (Table 10)" },
    weldDetails: { page: 25, label: "Weld details — Table 11 (§5.9)" },
    layerTechnique: { page: 25, label: "Layer technique (Table 12)" },
    testMethods: { page: 27, label: "Test methods (Table 13)" },
    shieldingGas: {
      page: 35,
      label: "Shielding gas on certificate (§10)",
    },
    currentPolarity: {
      page: 35,
      label: "Current & polarity on certificate (§10)",
    },
    jobKnowledge: { page: 38, label: "Job knowledge (Annex B)" },
    revalidation: { page: 34, label: "Revalidation (Section 9.3)" },
  },
} as const;

export type Iso9606TableKey = keyof typeof ISO_9606_1.tables;

export function iso9606PdfHref(page?: number): string {
  const base = "/api/standards/iso9606-1";
  return page ? `${base}#page=${page}` : base;
}

/** CEN ISO/TR 20172:2021 — European grade → ISO/TR 15608 group lookup (NOT qualification ranges). */
export const TR_20172 = {
  title: "CEN ISO/TR 20172:2021",
  fileName: "CEN-ISO-TR-20172-2021-en.pdf",
  /** Table 1 — steel (continues from ~page 8). */
  materialTablePage: 8,
  tables: {
    steel: { page: 8, label: "Table 1 — Steel" },
    aluminium: { page: 0, label: "Table 2 — Aluminium (see PDF TOC)" },
    copper: { page: 0, label: "Table 3 — Copper (see PDF TOC)" },
    castIron: { page: 0, label: "Table 4 — Cast iron (see PDF TOC)" },
    nickel: { page: 0, label: "Tables 5–6 — Nickel alloys (see PDF TOC)" },
  },
} as const;

export const TR_20173 = {
  title: "ISO/TR 20173:2018",
  fileName: "ISO-TR_20173_2018-07_e.pdf",
  materialTablePage: 8,
} as const;

export function tr20172PdfHref(page?: number): string {
  const base = "/api/standards/tr20172";
  return page ? `${base}#page=${page}` : base;
}

export function tr20173PdfHref(page?: number): string {
  const base = "/api/standards/tr20173";
  return page ? `${base}#page=${page}` : base;
}

