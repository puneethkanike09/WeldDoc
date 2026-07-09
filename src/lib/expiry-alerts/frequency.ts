import type { AlertEmailFrequency } from "@/types/db";
import {
  isoWeekdayInTimezone,
  localDateKey,
  weeksSinceEpochMondayForTz,
} from "@/lib/expiry-alerts/send-time";

const DAY_MS = 1000 * 60 * 60 * 24;

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
  timeZone = "Asia/Kolkata",
): boolean {
  switch (frequency) {
    case "once":
      // Gating handled per-qualification; org digest sends whenever fresh alerts exist.
      return true;

    case "daily": {
      if (!lastSentAt) return true;
      return localDateKey(lastSentAt, timeZone) !== localDateKey(now, timeZone);
    }

    case "every_2_days": {
      if (!lastSentAt) return true;
      const elapsed = now.getTime() - lastSentAt.getTime();
      return elapsed >= 2 * DAY_MS;
    }

    case "weekly": {
      if (isoWeekdayInTimezone(now, timeZone) !== 1) return false;
      if (!lastSentAt) return true;
      return localDateKey(lastSentAt, timeZone) !== localDateKey(now, timeZone);
    }

    case "twice_weekly": {
      const wd = isoWeekdayInTimezone(now, timeZone);
      if (wd !== 1 && wd !== 4) return false;
      if (!lastSentAt) return true;
      return localDateKey(lastSentAt, timeZone) !== localDateKey(now, timeZone);
    }

    case "every_3_weeks": {
      if (isoWeekdayInTimezone(now, timeZone) !== 1) return false;
      if (weeksSinceEpochMondayForTz(now, timeZone) % 3 !== 0) return false;
      if (!lastSentAt) return true;
      return localDateKey(lastSentAt, timeZone) !== localDateKey(now, timeZone);
    }

    default:
      return true;
  }
}

export function usesRepeatingDigest(frequency: AlertEmailFrequency): boolean {
  return frequency !== "once";
}
