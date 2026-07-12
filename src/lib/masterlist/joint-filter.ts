export function matchesJointFilter(
  jointType: string,
  filter: "all" | "BW" | "FW",
): boolean {
  if (filter === "all") return true;
  return jointType.includes(filter);
}
