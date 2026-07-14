import type { QualificationRecord, Welder, WpqStatus } from "@/types/db";
import {
  processLabel,
  qualificationProcessLabel,
} from "@/lib/iso9606/constants";
import { activeQualifications } from "@/lib/qualification-active";

export type OverallStatus =
  | "Active"
  | "Expiring"
  | "Expired"
  | "Pending"
  | "Inactive"
  | "Suspended"
  | "None";

export type QualState = "current" | "expiring" | "expired";

export interface QualCounts {
  current: number;
  expiring: number;
  expired: number;
}

export interface ProcessStatus {
  label: string;
  state: QualState;
}

export interface WelderSummary {
  overall: OverallStatus;
  nearestExpiry: string | null;
  daysToExpiry: number | null;
  processes: string[];
  approvedCount: number;
  /** Traffic-light counts across the welder's issued qualifications. */
  qualCounts: QualCounts;
  /** One chip per issued qualification, including multi-process labels. */
  processStatuses: ProcessStatus[];
}

const DAY = 1000 * 60 * 60 * 24;

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / DAY);
}

/** Classify a single WPQ into a traffic-light state, or null if not issued. */
function classifyWpq(
  w: Pick<QualificationRecord, "wpq_status" | "expiry_date">,
  expiringWindowDays: number,
): QualState | null {
  if (w.wpq_status !== "Approved" && w.wpq_status !== "Expired") return null;
  const d = daysUntil(w.expiry_date);
  if (w.wpq_status === "Expired" || (d !== null && d < 0)) return "expired";
  if (d !== null && d <= expiringWindowDays) return "expiring";
  return "current";
}

const STATE_PRIORITY: Record<QualState, number> = {
  current: 3,
  expiring: 2,
  expired: 1,
};

const EMPTY_QUAL_BREAKDOWN: Pick<
  WelderSummary,
  "qualCounts" | "processStatuses"
> = {
  qualCounts: { current: 0, expiring: 0, expired: 0 },
  processStatuses: [],
};

function processLabelsForFilter(
  w: Pick<QualificationRecord, "process" | "process_2">,
): string[] {
  const labels = [processLabel(w.process)];
  if (w.process_2?.trim()) labels.push(processLabel(w.process_2));
  return labels;
}

/** Traffic-light counts + per-qualification process chips from a welder's WPQs. */
export function buildQualBreakdown(
  wpqs: QualificationRecord[],
  expiringWindowDays: number,
): { qualCounts: QualCounts; processStatuses: ProcessStatus[] } {
  const qualCounts: QualCounts = { current: 0, expiring: 0, expired: 0 };
  const processStatuses: ProcessStatus[] = [];

  for (const w of wpqs) {
    const state = classifyWpq(w, expiringWindowDays);
    if (!state) continue;
    qualCounts[state] += 1;
    processStatuses.push({
      label: qualificationProcessLabel(w.process, w.process_2),
      state,
    });
  }

  processStatuses.sort(
    (a, b) =>
      STATE_PRIORITY[b.state] - STATE_PRIORITY[a.state] ||
      a.label.localeCompare(b.label),
  );

  return { qualCounts, processStatuses };
}

export function summarizeWelder(
  welder: Pick<Welder, "status">,
  wpqs: QualificationRecord[],
  expiringWindowDays = 30,
): WelderSummary {
  wpqs = activeQualifications(wpqs);
  const processes = Array.from(
    new Set(wpqs.flatMap((w) => processLabelsForFilter(w))),
  );
  const breakdown = buildQualBreakdown(wpqs, expiringWindowDays);

  if (welder.status === "Inactive" || welder.status === "Suspended") {
    return {
      overall: welder.status,
      nearestExpiry: null,
      daysToExpiry: null,
      processes: [],
      approvedCount: 0,
      ...EMPTY_QUAL_BREAKDOWN,
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
      ...breakdown,
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
    ...breakdown,
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

const DISCARDABLE_WPQ_STATUSES: WpqStatus[] = [
  "Draft",
  "Pending_NDT",
  "Failed",
];

export function canDiscardWpq(status: WpqStatus): boolean {
  return DISCARDABLE_WPQ_STATUSES.includes(status);
}
