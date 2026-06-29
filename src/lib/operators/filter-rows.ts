import type { OperatorRow } from "@/lib/operators/registry-row";

export function filterOperatorRows(
  rows: OperatorRow[],
  filters: { q?: string; status?: string; process?: string },
): OperatorRow[] {
  const term = (filters.q ?? "").trim().toLowerCase();
  const status = filters.status ?? "all";
  const process = filters.process ?? "all";

  return rows.filter((r) => {
    if (
      term &&
      !r.full_name.toLowerCase().includes(term) &&
      !r.uid.toLowerCase().includes(term) &&
      !(r.operator_id ?? "").toLowerCase().includes(term)
    ) {
      return false;
    }
    if (status !== "all" && r.summary.overall !== status) return false;
    if (process !== "all" && !r.summary.processes.includes(process)) return false;
    return true;
  });
}
