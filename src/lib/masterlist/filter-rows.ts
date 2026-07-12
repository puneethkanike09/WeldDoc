import type { MasterRow } from "@/lib/masterlist";
import { matchesJointFilter } from "@/lib/masterlist/joint-filter";

export type WelderMasterListFilterParams = {
  q?: string;
  status?: string;
  joint?: string;
};

export function filterWelderMasterRows(
  rows: MasterRow[],
  { q = "", status = "all", joint = "all" }: WelderMasterListFilterParams,
): MasterRow[] {
  const term = q.trim().toLowerCase();
  const jointFilter = joint === "BW" || joint === "FW" ? joint : "all";

  return rows.filter((r) => {
    if (
      term &&
      !r.welderName.toLowerCase().includes(term) &&
      !r.welderNo.toLowerCase().includes(term) &&
      !r.process.toLowerCase().includes(term)
    ) {
      return false;
    }
    if (status !== "all" && r.status !== status) return false;
    if (!matchesJointFilter(r.jointType, jointFilter)) return false;
    return true;
  });
}

export function parseWelderMasterListFilters(searchParams: {
  q?: string;
  status?: string;
  joint?: string;
}): WelderMasterListFilterParams {
  return {
    q: searchParams.q ?? "",
    status: searchParams.status ?? "all",
    joint: searchParams.joint ?? "all",
  };
}
