import type { SupabaseClient } from "@supabase/supabase-js";
import { processLabel } from "@/lib/iso14732/constants";
import type {
  Operator,
  OperatorQualification,
  OperatorRange,
} from "@/types/db";
import { isActiveRegistryStatus } from "@/lib/registry-status";
import { isActiveQualification } from "@/lib/qualification-active";

export interface OperatorMasterRow {
  operatorName: string;
  operatorId: string;
  process: string;
  standard: string;
  weldingType: string;
  productType: string;
  jointType: string;
  weldingMode: string;
  rangeSummary: string;
  status: string;
  isLegacy: boolean;
  issued: string;
  expiry: string;
  revalidation: string;
}

export async function getOperatorMasterListRows(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OperatorMasterRow[]> {
  const [{ data: oqRows }, { data: operatorRows }] = await Promise.all([
    supabase
      .from("operator_qualifications")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("operators").select("*").eq("org_id", orgId),
  ]);

  const oqs = (oqRows ?? []) as OperatorQualification[];
  const operators = new Map(
    ((operatorRows ?? []) as Operator[]).map((o) => [o.id, o]),
  );

  const { data: rangeRows } = await supabase
    .from("operator_ranges")
    .select("*")
    .in(
      "oq_id",
      oqs.length ? oqs.map((q) => q.id) : ["00000000-0000-0000-0000-000000000000"],
    );
  const ranges = new Map(
    ((rangeRows ?? []) as OperatorRange[]).map((r) => [r.oq_id, r]),
  );

  return oqs.flatMap((q) => {
    const operator = operators.get(q.operator_id);
    if (!operator || !isActiveRegistryStatus(operator.status)) return [];
    if (!isActiveQualification(q)) return [];

    const range = ranges.get(q.id);
    return [
      {
        operatorName: operator.full_name,
        operatorId: operator.operator_id ?? "—",
      process: processLabel(q.process),
      standard: "ISO 14732",
      weldingType: q.welding_type ?? "—",
      productType: q.product_type ?? "—",
      jointType: q.joint_type ?? "—",
      weldingMode: q.welding_mode ?? "—",
      rangeSummary: range?.summary ?? "—",
      status: q.oq_status,
      isLegacy: q.is_legacy,
      issued: q.certificate_issued_date ?? "—",
      expiry: q.expiry_date ?? "—",
      revalidation: q.revalidation_method,
      },
    ];
  });
}

export const OPERATOR_MASTER_COLUMNS: {
  key: keyof OperatorMasterRow;
  label: string;
}[] = [
  { key: "operatorName", label: "Operator" },
  { key: "operatorId", label: "Operator ID" },
  { key: "process", label: "Process" },
  { key: "standard", label: "Standard" },
  { key: "weldingType", label: "Welding type" },
  { key: "productType", label: "Product" },
  { key: "jointType", label: "Joint" },
  { key: "weldingMode", label: "Mode" },
  { key: "rangeSummary", label: "Range of qualification" },
  { key: "status", label: "Status" },
  { key: "issued", label: "Issued" },
  { key: "expiry", label: "Expiry" },
  { key: "revalidation", label: "Reval." },
];
