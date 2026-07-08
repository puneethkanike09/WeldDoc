import type { WelderStatus } from "@/types/db";

export function isActiveRegistryStatus(status: WelderStatus): boolean {
  return status === "Active";
}

export function idCardRegistryNotice(
  status: WelderStatus,
  kind: "welder" | "operator",
): string | null {
  const label = kind === "welder" ? "welder" : "operator";
  if (status === "Inactive") {
    return `This ${label} is currently inactive and is not authorised to work.`;
  }
  if (status === "Suspended") {
    return `This ${label} is currently suspended and is not authorised to work.`;
  }
  return null;
}
