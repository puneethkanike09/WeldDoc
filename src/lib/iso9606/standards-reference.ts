/** In-repo reference copy of the welding standard used by WeldDoc. */
export const ISO_9606_1 = {
  title: "BS EN ISO 9606-1:2017",
  shortTitle: "EN ISO 9606-1:2017",
  fileName: "BS_EN_ISO_9606-1-2017.pdf",
  clauses: {
    /** §9 Period of validity — revalidation options a/b/c (p34 in BS EN ISO 9606-1:2017). */
    revalidation: {
      section: "9.3",
      page: 34,
      heading: "Revalidation of welder qualification",
    },
  },
} as const;

export function iso9606PdfHref(page?: number): string {
  const base = "/api/standards/iso9606-1";
  return page ? `${base}#page=${page}` : base;
}
