import type { StandardSlug } from "@/lib/standards/catalog";
import {
  columnDefsFromCatalog,
  columnMetaFromCatalog,
  mergeMasterListColumnsConfig,
  normalizeColumnOrder,
  type MasterListColumnsConfig,
} from "@/lib/masterlist/column-config";

export const OPERATOR_MASTER_LIST_COLUMN_CATALOG = [
  { key: "slNo", label: "SL. NO.", description: "Sequential row number" },
  {
    key: "operatorName",
    label: "Operator",
    description: "Operator full name",
  },
  {
    key: "operatorId",
    label: "Operator ID",
    description: "Plant operator ID",
  },
  { key: "process", label: "Process", description: "Welding process" },
  { key: "standard", label: "Standard", description: "Qualification standard" },
  {
    key: "weldingType",
    label: "Welding type",
    description: "Mechanised / automatic / robotic",
  },
  { key: "productType", label: "Product", description: "Product type tested" },
  { key: "jointType", label: "Joint", description: "Joint type tested" },
  { key: "weldingMode", label: "Mode", description: "Welding mode" },
  {
    key: "rangeSummary",
    label: "Range of qualification",
    description: "Computed range summary",
  },
  { key: "status", label: "Status", description: "Qualification status" },
  { key: "issued", label: "Issued", description: "Certificate issue date" },
  { key: "expiry", label: "Expiry", description: "Certificate expiry date" },
  {
    key: "revalidation",
    label: "Reval.",
    description: "Revalidation method",
  },
] as const;

export type OperatorMasterColumnKey =
  (typeof OPERATOR_MASTER_LIST_COLUMN_CATALOG)[number]["key"];

export const ALL_OPERATOR_MASTER_COLUMN_KEYS: OperatorMasterColumnKey[] =
  OPERATOR_MASTER_LIST_COLUMN_CATALOG.map((c) => c.key);

export const DEFAULT_OPERATOR_MASTERLIST_COLUMNS: OperatorMasterColumnKey[] = [
  ...ALL_OPERATOR_MASTER_COLUMN_KEYS,
];

const OPERATOR_SLUG = "iso-14732" as const satisfies StandardSlug;

export function orderedOperatorMasterListColumns(
  raw: unknown,
): OperatorMasterColumnKey[] {
  return normalizeColumnOrder(
    raw,
    OPERATOR_SLUG,
    ALL_OPERATOR_MASTER_COLUMN_KEYS,
  ) as OperatorMasterColumnKey[];
}

export function operatorMasterListColumnDefs(raw: unknown) {
  return columnDefsFromCatalog(
    orderedOperatorMasterListColumns(raw),
    OPERATOR_MASTER_LIST_COLUMN_CATALOG,
  );
}

export function operatorMasterListColumnMeta(key: OperatorMasterColumnKey) {
  return columnMetaFromCatalog(key, OPERATOR_MASTER_LIST_COLUMN_CATALOG);
}

export { mergeMasterListColumnsConfig, type MasterListColumnsConfig };
