/** EN ISO 9606-1:2017 — PDF reference anchors for in-app globe links. */
export const ISO_9606_1 = {
  title: "BS EN ISO 9606-1:2017",
  shortTitle: "EN ISO 9606-1:2017",
  fileName: "BS_EN_ISO_9606-1-2017.pdf",
  tables: {
    process: { page: 12, label: "Welding processes (Table 1)" },
    fillerGroup: { page: 14, label: "Filler material groups (Table 2)" },
    thicknessBw: { page: 18, label: "Deposited thickness — butt welds (Table 6)" },
    pipeOd: { page: 19, label: "Outside pipe diameter (Table 7)" },
    thicknessFw: { page: 20, label: "Material thickness — fillet welds (Table 8)" },
    positionBw: { page: 21, label: "Welding positions — butt welds (Table 9)" },
    positionFw: { page: 22, label: "Welding positions — fillet welds (Table 10)" },
    weldDetails: { page: 28, label: "Weld details (Section 11)" },
    layerTechnique: { page: 16, label: "Layer technique (Section 5.4)" },
    revalidation: { page: 34, label: "Revalidation (Section 9.3)" },
  },
} as const;

export type Iso9606TableKey = keyof typeof ISO_9606_1.tables;

export function iso9606PdfHref(page?: number): string {
  const base = "/api/standards/iso9606-1";
  return page ? `${base}#page=${page}` : base;
}

export const TR_20172 = {
  title: "ISO/TR 20172:2021",
  fileName: "CEN-ISO-TR-20172-2021-en.pdf",
  page: 1,
} as const;

export const TR_20173 = {
  title: "ISO/TR 20173:2018",
  fileName: "ISO-TR_20173_2018-07_e.pdf",
  page: 1,
} as const;

export function tr20172PdfHref(page?: number): string {
  const base = "/api/standards/tr20172";
  return page ? `${base}#page=${page}` : base;
}

export function tr20173PdfHref(page?: number): string {
  const base = "/api/standards/tr20173";
  return page ? `${base}#page=${page}` : base;
}
