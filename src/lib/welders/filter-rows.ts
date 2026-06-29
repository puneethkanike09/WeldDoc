import type { WelderRow } from "@/lib/welders/registry-row";

export function filterWelderRows(
  rows: WelderRow[],
  filters: { q?: string; status?: string; process?: string },
): WelderRow[] {
  const term = (filters.q ?? "").trim().toLowerCase();
  const status = filters.status ?? "all";
  const process = filters.process ?? "all";

  return rows.filter((r) => {
    if (
      term &&
      !r.full_name.toLowerCase().includes(term) &&
      !r.uid.toLowerCase().includes(term) &&
      !(r.welder_id ?? "").toLowerCase().includes(term)
    ) {
      return false;
    }
    if (status !== "all" && r.summary.overall !== status) return false;
    if (process !== "all" && !r.summary.processes.includes(process)) return false;
    return true;
  });
}
