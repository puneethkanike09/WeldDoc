import type { QualificationRecord, Welder } from "@/types/db";
import { processLabel } from "@/lib/iso9606/constants";

export type OverallStatus =
  | "Active"
  | "Expiring"
  | "Expired"
  | "Pending"
  | "Inactive"
  | "Suspended"
  | "None";

export interface WelderSummary {
  overall: OverallStatus;
  nearestExpiry: string | null;
  daysToExpiry: number | null;
  processes: string[];
  approvedCount: number;
}

const DAY = 1000 * 60 * 60 * 24;

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / DAY);
}

export function summarizeWelder(
  welder: Pick<Welder, "status">,
  wpqs: QualificationRecord[],
  expiringWindowDays = 30,
): WelderSummary {
  const processes = Array.from(
    new Set(wpqs.map((w) => processLabel(w.process))),
  );

  if (welder.status === "Inactive" || welder.status === "Suspended") {
    return {
      overall: welder.status,
      nearestExpiry: null,
      daysToExpiry: null,
      processes,
      approvedCount: 0,
    };
  }

  const approved = wpqs.filter(
    (w) => w.wpq_status === "Approved" || w.wpq_status === "Expired",
  );

  if (approved.length === 0) {
    const hasPending = wpqs.some((w) =>
      ["Draft", "Pending_NDT"].includes(w.wpq_status),
    );
    return {
      overall: hasPending ? "Pending" : "None",
      nearestExpiry: null,
      daysToExpiry: null,
      processes,
      approvedCount: 0,
    };
  }

  const withExpiry = approved
    .filter((w) => w.expiry_date)
    .sort(
      (a, b) =>
        new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime(),
    );

  const liveCount = approved.filter((w) => {
    const d = daysUntil(w.expiry_date);
    return w.wpq_status === "Approved" && (d === null || d >= 0);
  }).length;

  // Nearest non-expired expiry, else most recent expired.
  const future = withExpiry.find((w) => (daysUntil(w.expiry_date) ?? 1) >= 0);
  const reference = future ?? withExpiry[withExpiry.length - 1];
  const nearestExpiry = reference?.expiry_date ?? null;
  const dte = daysUntil(nearestExpiry);

  let overall: OverallStatus;
  if (liveCount === 0) overall = "Expired";
  else if (dte !== null && dte <= expiringWindowDays) overall = "Expiring";
  else overall = "Active";

  return {
    overall,
    nearestExpiry,
    daysToExpiry: dte,
    processes,
    approvedCount: liveCount,
  };
}

export const STATUS_TONE: Record<
  OverallStatus,
  "active" | "expiring" | "expired" | "neutral" | "sapphire"
> = {
  Active: "active",
  Expiring: "expiring",
  Expired: "expired",
  Pending: "sapphire",
  None: "neutral",
  Inactive: "neutral",
  Suspended: "expired",
};
