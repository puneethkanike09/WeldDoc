import type { AlertEmailFrequency } from "@/types/db";

const DAY_MS = 1000 * 60 * 60 * 24;

/** UTC date key YYYY-MM-DD for schedule comparisons. */
export function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday = 1 … Sunday = 7 (ISO weekday). */
function isoWeekday(d: Date): number {
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

/** Monday of the ISO week containing `d` (UTC). */
function mondayOfWeek(d: Date): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const wd = isoWeekday(copy);
  copy.setUTCDate(copy.getUTCDate() - (wd - 1));
  return copy;
}

/** Weeks since Unix epoch Monday — stable cadence for every-3-weeks. */
function weeksSinceEpochMonday(d: Date): number {
  const mon = mondayOfWeek(d);
  return Math.floor(mon.getTime() / (7 * DAY_MS));
}

export const ALERT_FREQUENCY_OPTIONS: {
  value: AlertEmailFrequency;
  label: string;
  hint: string;
}[] = [
  {
    value: "once",
    label: "Once per lead window",
    hint: "One email at each lead day (e.g. 30d, 7d) and when overdue — same as before.",
  },
  {
    value: "daily",
    label: "Every day",
    hint: "Daily digest of all qualifications in your lead windows.",
  },
  {
    value: "every_2_days",
    label: "Every 2 days",
    hint: "Send every 2 days after the last digest (relative to last send).",
  },
  {
    value: "weekly",
    label: "Weekly (Mondays)",
    hint: "One digest each Monday.",
  },
  {
    value: "twice_weekly",
    label: "Twice a week (Mon & Thu)",
    hint: "Digests on Monday and Thursday.",
  },
  {
    value: "every_3_weeks",
    label: "Every 3 weeks (Mondays)",
    hint: "Digest every third Monday.",
  },
];

const FREQUENCY_SET = new Set<string>(
  ALERT_FREQUENCY_OPTIONS.map((o) => o.value),
);

export function parseAlertEmailFrequency(
  raw: string | null | undefined,
): AlertEmailFrequency {
  const v = raw?.trim();
  if (v && FREQUENCY_SET.has(v)) return v as AlertEmailFrequency;
  return "once";
}

/**
 * Whether the org digest should be sent on this cron run.
 * `lastSentAt` is the timestamp of the most recent org-digest notification_log row.
 */
export function shouldSendOrgDigest(
  frequency: AlertEmailFrequency,
  now = new Date(),
  lastSentAt: Date | null,
): boolean {
  switch (frequency) {
    case "once":
      // Gating handled per-qualification; org digest sends whenever fresh alerts exist.
      return true;

    case "daily":
      return true;

    case "every_2_days": {
      if (!lastSentAt) return true;
      const elapsed = now.getTime() - lastSentAt.getTime();
      return elapsed >= 2 * DAY_MS;
    }

    case "weekly": {
      if (isoWeekday(now) !== 1) return false;
      if (!lastSentAt) return true;
      return utcDateKey(lastSentAt) !== utcDateKey(now);
    }

    case "twice_weekly": {
      const wd = isoWeekday(now);
      if (wd !== 1 && wd !== 4) return false;
      if (!lastSentAt) return true;
      return utcDateKey(lastSentAt) !== utcDateKey(now);
    }

    case "every_3_weeks": {
      if (isoWeekday(now) !== 1) return false;
      if (weeksSinceEpochMonday(now) % 3 !== 0) return false;
      if (!lastSentAt) return true;
      return utcDateKey(lastSentAt) !== utcDateKey(now);
    }

    default:
      return true;
  }
}

export function usesRepeatingDigest(frequency: AlertEmailFrequency): boolean {
  return frequency !== "once";
}
