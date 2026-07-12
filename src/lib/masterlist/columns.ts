import type { StandardSlug } from "@/lib/standards/catalog";

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

export type MasterListColumnsConfig = Partial<
  Record<StandardSlug, MasterExportKey[]>
>;

const WELDER_SLUG = "iso9606-1" as const;

function isMasterExportKey(v: string): v is MasterExportKey {
  return (ALL_WELDER_MASTER_EXPORT_KEYS as string[]).includes(v);
}

export function parseMasterListColumnsConfig(
  raw: unknown,
): MasterListColumnsConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: MasterListColumnsConfig = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const enabled = value.filter(
      (v): v is MasterExportKey =>
        typeof v === "string" && isMasterExportKey(v),
    );
    if (enabled.length > 0) {
      out[key as StandardSlug] = enabled;
    }
  }
  return out;
}

export function orderedMasterListColumns(
  raw: unknown,
  slug: StandardSlug = WELDER_SLUG,
): MasterExportKey[] {
  const allowed = new Set<string>(ALL_WELDER_MASTER_EXPORT_KEYS);
  const defaults = DEFAULT_WELDER_MASTERLIST_COLUMNS;
  if (slug !== WELDER_SLUG) return [...defaults];

  const config = parseMasterListColumnsConfig(raw);
  const stored = config[slug];
  if (!stored) return [...defaults];

  const enabled = stored.filter((id) => allowed.has(id));
  return enabled.length > 0 ? enabled : [...defaults];
}

export function mergeMasterListColumnsConfig(
  raw: unknown,
  slug: StandardSlug,
  enabled: MasterExportKey[],
): MasterListColumnsConfig {
  return {
    ...parseMasterListColumnsConfig(raw),
    [slug]: enabled,
  };
}

export function masterListColumnDefs(
  raw: unknown,
  slug: StandardSlug = WELDER_SLUG,
): { key: MasterExportKey; label: string }[] {
  const labelByKey = Object.fromEntries(
    WELDER_MASTER_LIST_COLUMN_CATALOG.map((c) => [c.key, c.label]),
  ) as Record<MasterExportKey, string>;

  return orderedMasterListColumns(raw, slug).map((key) => ({
    key,
    label: labelByKey[key],
  }));
}

export function masterListColumnMeta(key: MasterExportKey) {
  return WELDER_MASTER_LIST_COLUMN_CATALOG.find((c) => c.key === key);
}
