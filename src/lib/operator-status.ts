import type { Operator, OperatorQualification, OqStatus } from "@/types/db";
import { processLabel } from "@/lib/iso14732/constants";
import { activeQualifications } from "@/lib/qualification-active";
import type {
  ProcessStatus,
  QualCounts,
  QualState,
} from "@/lib/welder-status";

export type OverallStatus =
  | "Active"
  | "Expiring"
  | "Expired"
  | "Pending"
  | "Inactive"
  | "Suspended"
  | "None";

export interface OperatorSummary {
  overall: OverallStatus;
  nearestExpiry: string | null;
  daysToExpiry: number | null;
  processes: string[];
  approvedCount: number;
  qualCounts: QualCounts;
  processStatuses: ProcessStatus[];
}

const DAY = 1000 * 60 * 60 * 24;

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / DAY);
}

function classifyOq(
  o: Pick<OperatorQualification, "oq_status" | "expiry_date">,
  expiringWindowDays: number,
): QualState | null {
  if (o.oq_status !== "Approved" && o.oq_status !== "Expired") return null;
  const d = daysUntil(o.expiry_date);
  if (o.oq_status === "Expired" || (d !== null && d < 0)) return "expired";
  if (d !== null && d <= expiringWindowDays) return "expiring";
  return "current";
}

const STATE_PRIORITY: Record<QualState, number> = {
  current: 3,
  expiring: 2,
  expired: 1,
};

const EMPTY_QUAL_BREAKDOWN: {
  qualCounts: QualCounts;
  processStatuses: ProcessStatus[];
} = {
  qualCounts: { current: 0, expiring: 0, expired: 0 },
  processStatuses: [],
};

function buildOperatorQualBreakdown(
  oqs: OperatorQualification[],
  expiringWindowDays: number,
): { qualCounts: QualCounts; processStatuses: ProcessStatus[] } {
  const qualCounts: QualCounts = { current: 0, expiring: 0, expired: 0 };
  const processStatuses: ProcessStatus[] = [];

  for (const o of oqs) {
    const state = classifyOq(o, expiringWindowDays);
    if (!state) continue;
    qualCounts[state] += 1;
    processStatuses.push({
      label: processLabel(o.process ?? "—"),
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

export function summarizeOperator(
  operator: Pick<Operator, "status">,
  oqs: OperatorQualification[],
  expiringWindowDays = 30,
): OperatorSummary {
  oqs = activeQualifications(oqs);
  const processes = Array.from(
    new Set(oqs.map((o) => processLabel(o.process))),
  );
  const breakdown = buildOperatorQualBreakdown(oqs, expiringWindowDays);

  if (operator.status === "Inactive" || operator.status === "Suspended") {
    return {
      overall: operator.status,
      nearestExpiry: null,
      daysToExpiry: null,
      processes: [],
      approvedCount: 0,
      ...EMPTY_QUAL_BREAKDOWN,
    };
  }

  const approved = oqs.filter(
    (o) => o.oq_status === "Approved" || o.oq_status === "Expired",
  );

  if (approved.length === 0) {
    const hasPending = oqs.some((o) =>
      ["Draft", "Pending_NDT"].includes(o.oq_status),
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
    .filter((o) => o.expiry_date)
    .sort(
      (a, b) =>
        new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime(),
    );

  const liveCount = approved.filter((o) => {
    const d = daysUntil(o.expiry_date);
    return o.oq_status === "Approved" && (d === null || d >= 0);
  }).length;

  const future = withExpiry.find((o) => (daysUntil(o.expiry_date) ?? 1) >= 0);
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

const DISCARDABLE_OQ_STATUSES: OqStatus[] = [
  "Draft",
  "Pending_NDT",
  "Failed",
];

export function canDiscardOq(status: OqStatus): boolean {
  return DISCARDABLE_OQ_STATUSES.includes(status);
}
