/** Shared PED master list formatting helpers. */

export function weldTypeCode(jointTypes: string[]): string {
  const hasBW = jointTypes.includes("BW");
  const hasFW = jointTypes.includes("FW");
  if (hasBW && hasFW) return "BW/FW";
  return hasBW ? "BW" : "FW";
}
