import type { WeldingStandard } from "@/types/db";
import type { StatTone } from "@/components/app/dashboard-stat";

export type StandardSlug =
  | "iso9606-1"
  | "asme-ix"
  | "aws-d1-1"
  | "iso-14732";

export type StandardStatus = "active" | "coming_soon";

export interface StandardCatalogEntry {
  slug: StandardSlug;
  dbKey: WeldingStandard;
  title: string;
  code: string;
  subtitle: string;
  description: string;
  status: StandardStatus;
  pdfFileName: string;
  shortLabel: string;
  cardTone: StatTone;
}

export const WELDING_STANDARDS_CATALOG: StandardCatalogEntry[] = [
  {
    slug: "iso9606-1",
    dbKey: "ISO_9606_1",
    title: "ISO 9606-1",
    code: "EN ISO 9606-1:2017",
    subtitle: "Welder qualification — fusion welding",
    description:
      "Qualify welders for steel and nickel alloys. Full workspace: welder registry, WPQ wizard, certificates, and master lists.",
    status: "active",
    pdfFileName: "BS_EN_ISO_9606-1-2017.pdf",
    shortLabel: "EN ISO 9606-1",
    cardTone: "brand",
  },
  {
    slug: "iso-14732",
    dbKey: "ISO_14732",
    title: "ISO 14732",
    code: "ISO 14732:2025",
    subtitle: "Welding operator qualification",
    description:
      "Qualify welding operators for mechanised and automatic welding. Full workspace: operator registry, qualification wizard, certificates, and alerts.",
    status: "active",
    pdfFileName: "ISO 14732-2025 Operator.pdf",
    shortLabel: "ISO 14732",
    cardTone: "danger",
  },
  {
    slug: "asme-ix",
    dbKey: "ASME_IX",
    title: "ASME Section IX",
    code: "ASME BPVC Section IX",
    subtitle: "Welding & brazing qualifications",
    description:
      "Performance qualification for welders and welding operators under the ASME Boiler and Pressure Vessel Code.",
    status: "coming_soon",
    pdfFileName: "ASME_BPVC_Section_IX_2025 (1).pdf",
    shortLabel: "ASME IX",
    cardTone: "active",
  },
  {
    slug: "aws-d1-1",
    dbKey: "AWS_D1_1",
    title: "AWS D1.1",
    code: "AWS D1.1:2025",
    subtitle: "Structural welding — steel",
    description:
      "Welder qualification for structural steel construction under the American Welding Society code.",
    status: "coming_soon",
    pdfFileName: "AWS_D1.1_2025.pdf",
    shortLabel: "AWS D1.1",
    cardTone: "warning",
  },
];

const SLUG_MAP = new Map(
  WELDING_STANDARDS_CATALOG.map((entry) => [entry.slug, entry]),
);

export function standardBySlug(slug: string): StandardCatalogEntry | undefined {
  return SLUG_MAP.get(slug as StandardSlug);
}

export function standardPdfApiPath(slug: StandardSlug): string {
  return `/api/standards/${slug}`;
}

export const ACTIVE_STANDARD_COOKIE = "Weld.Doc_active_standard";
export const ACTIVE_STANDARD_SLUG: StandardSlug = "iso9606-1";

export function activeStandardEntry(): StandardCatalogEntry {
  return SLUG_MAP.get(ACTIVE_STANDARD_SLUG)!;
}

/** @deprecated Use getActiveStandardSlug / activeStandardEntry from active-standard.server.ts on server */
export function activeStandardEntrySync(): StandardCatalogEntry {
  return SLUG_MAP.get(ACTIVE_STANDARD_SLUG)!;
}
