/** In-repo reference copies used by WeldDoc. */
export const ISO_9606_1 = {
  title: "BS EN ISO 9606-1:2017",
  shortTitle: "EN ISO 9606-1:2017",
  fileName: "BS_EN_ISO_9606-1-2017.pdf",
  apiPath: "/api/standards/iso9606-1",
  clauses: {
    revalidation: {
      section: "9.3",
      page: 34,
      heading: "Revalidation of welder qualification",
    },
  },
  /** PDF page anchors for range tables (BS EN ISO 9606-1:2017). */
  tables: {
    fmGroup: { number: 2, page: 19, heading: "Filler material groups" },
    fillerType111: { number: 4, page: 21, heading: "Filler types — process 111" },
    fillerTypeOther: { number: 5, page: 22, heading: "Filler types — other processes" },
    thicknessBw: { number: 6, page: 23, heading: "Deposited thickness range (butt)" },
    pipeOd: { number: 7, page: 24, heading: "Outside pipe diameter range" },
    thicknessFw: { number: 8, page: 25, heading: "Material thickness range (fillet)" },
    positionBw: { number: 9, page: 26, heading: "Welding positions — butt welds" },
    positionFw: { number: 10, page: 27, heading: "Welding positions — fillet welds" },
    layerTechnique: {
      number: "5.4",
      page: 27,
      heading: "Single-layer and multi-layer",
    },
    weldDetails: {
      number: 11,
      page: 32,
      heading: "Designation — weld details",
    },
    transferMode: {
      number: "5.5",
      page: 27,
      heading: "Transfer mode (GMAW)",
    },
    testing: { number: 13, page: 30, heading: "Mandatory tests" },
  },
} as const;

export const TR_20172 = {
  title: "CEN ISO/TR 20172:2021",
  fileName: "CEN-ISO-TR-20172-2021-en.pdf",
  apiPath: "/api/standards/tr20172",
  /** Material grouping table (ISO/TR 15608). */
  materialTablePage: 8,
} as const;

export const TR_20173 = {
  title: "ISO/TR 20173:2018",
  fileName: "ISO-TR_20173_2018-07_e.pdf",
  apiPath: "/api/standards/tr20173",
  materialTablePage: 8,
} as const;

export const ISO_14175 = {
  title: "ISO 14175",
  /** Shielding gases — referenced from WPS; no in-repo PDF wired yet. */
  note: "Shielding gas classification per ISO 14175",
} as const;

export function iso9606PdfHref(page?: number): string {
  const base = ISO_9606_1.apiPath;
  return page ? `${base}#page=${page}` : base;
}

export function tr20172PdfHref(page?: number): string {
  const base = TR_20172.apiPath;
  return page ? `${base}#page=${page}` : base;
}

export function tr20173PdfHref(page?: number): string {
  const base = TR_20173.apiPath;
  return page ? `${base}#page=${page}` : base;
}

export type Iso9606TableKey = keyof typeof ISO_9606_1.tables;
