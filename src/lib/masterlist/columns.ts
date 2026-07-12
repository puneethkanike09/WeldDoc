import type { StandardSlug } from "@/lib/standards/catalog";
import {
  columnDefsFromCatalog,
  columnMetaFromCatalog,
  mergeMasterListColumnsConfig,
  parseMasterListColumnsConfig,
  type MasterListColumnsConfig,
} from "@/lib/masterlist/column-config";

export const WELDER_MASTER_LIST_COLUMN_CATALOG = [
  { key: "slNo", label: "SL. NO.", description: "Sequential row number" },
  {
    key: "welderName",
    label: "WELDER NAME",
    description: "Welder full name",
  },
  { key: "welderNo", label: "W#NO", description: "Plant welder ID" },
  { key: "process", label: "PROCESS", description: "Welding process" },
  { key: "jointType", label: "JOINT TYPE", description: "Butt / fillet coverage" },
  {
    key: "actualBwPosition",
    label: "Actual BW POSITION",
    description: "Position tested for butt weld",
  },
  {
    key: "actualFwPosition",
    label: "Actual FW POSITION",
    description: "Position tested for fillet weld",
  },
  {
    key: "qualifiedBwPosition",
    label: "Qualified BW POSITION",
    description: "Approved butt-weld positions",
  },
  {
    key: "qualifiedFwPosition",
    label: "Qualified FW POSITION",
    description: "Approved fillet-weld positions",
  },
  { key: "fmGroup", label: "FM Group", description: "Filler material group" },
  {
    key: "qualifiedDia",
    label: "Qualified Dia",
    description: "Qualified pipe diameter range",
  },
  {
    key: "qualifiedBwThk",
    label: "Qualified BW(THK)",
    description: "Qualified butt-weld thickness",
  },
  {
    key: "qualifiedFwThk",
    label: "Qualified FW(THK)",
    description: "Qualified fillet-weld thickness",
  },
  { key: "testDate", label: "TEST DATE", description: "Date of welding / test" },
  {
    key: "continuityExpiry",
    label: "6month validity Expiry Date",
    description: "Six-month continuity due date",
  },
  {
    key: "revalidationExpiry",
    label: "2yr/3yr Revalidation Expiry Date",
    description: "Certificate revalidation expiry",
  },
  { key: "status", label: "Status", description: "Qualification status" },
  {
    key: "revalidationMethod",
    label: "Revalidation method",
    description: "ISO 9606 revalidation method (9.3a / 9.3b / 9.3c)",
  },
] as const;

export type MasterExportKey =
  (typeof WELDER_MASTER_LIST_COLUMN_CATALOG)[number]["key"];

export const ALL_WELDER_MASTER_EXPORT_KEYS: MasterExportKey[] =
  WELDER_MASTER_LIST_COLUMN_CATALOG.map((c) => c.key);

export const DEFAULT_WELDER_MASTERLIST_COLUMNS: MasterExportKey[] = [
  ...ALL_WELDER_MASTER_EXPORT_KEYS,
];

export const MASTER_EXPORT_COLUMNS = WELDER_MASTER_LIST_COLUMN_CATALOG.map(
  (c) => ({ key: c.key, label: c.label }),
);

const WELDER_SLUG = "iso9606-1" as const satisfies StandardSlug;

export function orderedWelderMasterListColumns(
  raw: unknown,
): MasterExportKey[] {
  const config = parseMasterListColumnsConfig(raw);
  const stored = config[WELDER_SLUG];
  if (!stored) return [...DEFAULT_WELDER_MASTERLIST_COLUMNS];

  const allowed = new Set<string>(ALL_WELDER_MASTER_EXPORT_KEYS);
  const enabled = stored.filter((id) => allowed.has(id)) as MasterExportKey[];
  if (enabled.length === 0) return [...DEFAULT_WELDER_MASTERLIST_COLUMNS];

  const missing = ALL_WELDER_MASTER_EXPORT_KEYS.filter((k) => !enabled.includes(k));
  return [...enabled, ...missing];
}

export function welderMasterListColumnDefs(raw: unknown) {
  return columnDefsFromCatalog(
    orderedWelderMasterListColumns(raw),
    WELDER_MASTER_LIST_COLUMN_CATALOG,
  );
}

export function welderMasterListColumnMeta(key: MasterExportKey) {
  return columnMetaFromCatalog(key, WELDER_MASTER_LIST_COLUMN_CATALOG);
}

export {
  mergeMasterListColumnsConfig,
  type MasterListColumnsConfig,
};

/** @deprecated Use orderedWelderMasterListColumns */
export const orderedMasterListColumns = orderedWelderMasterListColumns;

/** @deprecated Use welderMasterListColumnDefs */
export const masterListColumnDefs = welderMasterListColumnDefs;

/** @deprecated Use welderMasterListColumnMeta */
export const masterListColumnMeta = welderMasterListColumnMeta;
