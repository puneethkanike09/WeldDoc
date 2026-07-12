import type { OperatorMasterRow } from "@/lib/operator-masterlist";

export type OperatorMasterListFilterParams = {
  q?: string;
  status?: string;
  weldingType?: string;
};

export function filterOperatorMasterRows(
  rows: OperatorMasterRow[],
  {
    q = "",
    status = "all",
    weldingType = "all",
  }: OperatorMasterListFilterParams,
): OperatorMasterRow[] {
  const term = q.trim().toLowerCase();

  return rows.filter((r) => {
    if (
      term &&
      !r.operatorName.toLowerCase().includes(term) &&
      !r.operatorId.toLowerCase().includes(term) &&
      !r.process.toLowerCase().includes(term)
    ) {
      return false;
    }
    if (status !== "all" && r.status !== status) return false;
    if (weldingType !== "all" && r.weldingType !== weldingType) return false;
    return true;
  });
}

export function parseOperatorMasterListFilters(searchParams: {
  q?: string;
  status?: string;
  weldingType?: string;
}): OperatorMasterListFilterParams {
  return {
    q: searchParams.q ?? "",
    status: searchParams.status ?? "all",
    weldingType: searchParams.weldingType ?? "all",
  };
}
