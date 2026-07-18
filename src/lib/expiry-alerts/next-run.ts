import type { AlertEmailFrequency } from "@/types/db";
import {
  isoWeekdayInTimezone,
  localTimeParts,
  parseAlertEmailTime,
  parseAlertEmailTimezone,
  weeksSinceEpochMondayForTz,
} from "@/lib/expiry-alerts/send-time";

/**
 * Convert a local calendar date + HH:MM in `timeZone` to a UTC Date.
 * Uses iterative refinement against Intl (no extra timezone deps).
 */
export function zonedDateTimeToUtc(
  dateKey: string,
  timeHHMM: string,
  timeZone: string,
): Date {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [hh, mm] = parseAlertEmailTime(timeHHMM).split(":").map(Number);
  // Initial guess: treat the wall time as UTC, then correct via formatter.
  let utc = Date.UTC(y, mo - 1, d, hh, mm, 0, 0);
  for (let i = 0; i < 4; i++) {
    const parts = localTimeParts(new Date(utc), timeZone);
    const [py, pmo, pd] = parts.dateKey.split("-").map(Number);
    const want = Date.UTC(y, mo - 1, d, hh, mm);
    const got = Date.UTC(py, pmo - 1, pd, parts.hour, parts.minute);
    const delta = want - got;
    if (delta === 0) break;
    utc += delta;
  }
  return new Date(utc);
}

function addLocalDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function atLocalTime(
  dateKey: string,
  timeHHMM: string,
  timeZone: string,
): Date {
  return zonedDateTimeToUtc(dateKey, timeHHMM, timeZone);
}

function isEligibleDay(
  frequency: AlertEmailFrequency,
  date: Date,
  timeZone: string,
): boolean {
  const wd = isoWeekdayInTimezone(date, timeZone);
  switch (frequency) {
    case "weekly":
      return wd === 1;
    case "twice_weekly":
      return wd === 1 || wd === 4;
    case "every_3_weeks":
      return wd === 1 && weeksSinceEpochMondayForTz(date, timeZone) % 3 === 0;
    default:
      return true;
  }
}

/**
 * First send slot at `timeHHMM` on/after `from` for daily-style frequencies.
 * If `strictlyAfter`, the slot must be > from (used after a successful claim).
 */
function nextDailySlot(
  from: Date,
  timeHHMM: string,
  timeZone: string,
  strictlyAfter: boolean,
): Date {
  const local = localTimeParts(from, timeZone);
  let dateKey = local.dateKey;
  let candidate = atLocalTime(dateKey, timeHHMM, timeZone);
  const ok = strictlyAfter
    ? candidate.getTime() > from.getTime()
    : candidate.getTime() >= from.getTime();
  if (!ok) {
    dateKey = addLocalDays(dateKey, 1);
    candidate = atLocalTime(dateKey, timeHHMM, timeZone);
  }
  return candidate;
}

/**
 * Walk forward day-by-day until an eligible weekday (and 3-week cadence) matches.
 */
function nextWeekdaySlot(
  frequency: AlertEmailFrequency,
  from: Date,
  timeHHMM: string,
  timeZone: string,
  strictlyAfter: boolean,
): Date {
  const startKey = localTimeParts(from, timeZone).dateKey;
  for (let dayOffset = 0; dayOffset < 400; dayOffset++) {
    const dateKey = addLocalDays(startKey, dayOffset);
    const candidate = atLocalTime(dateKey, timeHHMM, timeZone);
    const timeOk = strictlyAfter
      ? candidate.getTime() > from.getTime()
      : candidate.getTime() >= from.getTime();
    if (!timeOk) continue;
    if (isEligibleDay(frequency, candidate, timeZone)) {
      return candidate;
    }
  }
  return nextDailySlot(from, timeHHMM, timeZone, true);
}

/**
 * Compute the next UTC run instant for an org alert schedule.
 *
 * @param strictlyAfter - when true (after claim/send), never return `from` itself;
 *   when false (settings save), may return today's send time if still upcoming.
 */
export function calculateNextRun(opts: {
  frequency: AlertEmailFrequency;
  timeHHMM: string;
  timeZone: string;
  from?: Date;
  /** Default false = upcoming including now/today. True = strictly after `from`. */
  strictlyAfter?: boolean;
}): Date {
  const from = opts.from ?? new Date();
  const timeHHMM = parseAlertEmailTime(opts.timeHHMM);
  const timeZone = parseAlertEmailTimezone(opts.timeZone);
  const strictlyAfter = opts.strictlyAfter ?? false;
  const frequency = opts.frequency;

  switch (frequency) {
    case "once":
    case "daily":
      return nextDailySlot(from, timeHHMM, timeZone, strictlyAfter);

    case "every_2_days": {
      // Next eligible: today/upcoming at send time, then +2 local days thereafter.
      // When strictlyAfter a send, skip ahead 2 local days from the send's local date.
      if (!strictlyAfter) {
        return nextDailySlot(from, timeHHMM, timeZone, false);
      }
      const local = localTimeParts(from, timeZone);
      const dateKey = addLocalDays(local.dateKey, 2);
      return atLocalTime(dateKey, timeHHMM, timeZone);
    }

    case "weekly":
    case "twice_weekly":
    case "every_3_weeks":
      return nextWeekdaySlot(
        frequency,
        from,
        timeHHMM,
        timeZone,
        strictlyAfter,
      );

    default:
      return nextDailySlot(from, timeHHMM, timeZone, strictlyAfter);
  }
}

export function calculateNextRunIso(opts: Parameters<typeof calculateNextRun>[0]): string {
  return calculateNextRun(opts).toISOString();
}
