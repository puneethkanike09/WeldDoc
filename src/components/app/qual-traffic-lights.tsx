import { cn } from "@/lib/utils";
import type { ProcessStatus, QualCounts, QualState } from "@/lib/welder-status";

const CIRCLE_STYLES: Record<QualState, string> = {
  current: "border-active/40 bg-active/10 text-active-ink",
  expiring: "border-expiring/50 bg-expiring/15 text-expiring-ink",
  expired: "border-expired/40 bg-expired/10 text-expired-ink",
};

const CIRCLE_TITLES: Record<QualState, string> = {
  current: "Current qualifications",
  expiring: "Qualifications expiring soon",
  expired: "Expired qualifications",
};

/** Three traffic-light circles: current (green), expiring (amber), expired (red). */
export function QualCountLights({ counts }: { counts: QualCounts }) {
  const order: QualState[] = ["current", "expiring", "expired"];
  return (
    <div className="flex items-center gap-1.5">
      {order.map((state) => (
        <span
          key={state}
          title={CIRCLE_TITLES[state]}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full border text-[13px] font-semibold tabular-nums",
            CIRCLE_STYLES[state],
          )}
        >
          {counts[state]}
        </span>
      ))}
    </div>
  );
}

const CHIP_STYLES: Record<QualState, string> = {
  current: "border-active/40 bg-active/10 text-active-ink",
  expiring: "border-expiring/50 bg-expiring/15 text-expiring-ink",
  expired: "border-expired/40 bg-expired/10 text-expired-ink",
};

const CHIP_TITLES: Record<QualState, string> = {
  current: "Current",
  expiring: "Expiring soon",
  expired: "Expired",
};

/** Process chips, one per issued qualification (multi-process uses +). */
export function ProcessStatusChips({
  statuses,
}: {
  statuses: ProcessStatus[];
}) {
  if (statuses.length === 0) {
    return <span className="text-graphite">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((p, index) => (
        <span
          key={`${p.label}-${p.state}-${index}`}
          title={`${p.label} — ${CHIP_TITLES[p.state]}`}
          className={cn(
            "inline-flex items-center rounded-[var(--radius-tag)] border px-2 py-0.5 text-xs font-medium font-display tracking-tight",
            CHIP_STYLES[p.state],
          )}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
