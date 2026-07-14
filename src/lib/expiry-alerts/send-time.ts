/**
 * When true, Vercel Hobby once-daily cron is enough (ignores per-org send clock).
 * When false, a sub-daily caller (GitHub Actions every 10 min) is required so
 * each org's alert_email_time + timezone window can be respected.
 */
export const ALERT_CRON_IS_DAILY = false;

/** Send window half-open [configured time, configured time + window). Match cron cadence. */
export const ALERT_CRON_WINDOW_MINUTES = 10;

export const ALERT_TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Gulf (GST)" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "UTC", label: "UTC" },
];

const TIMEZONE_SET = new Set(ALERT_TIMEZONE_OPTIONS.map((o) => o.value));

export function parseAlertEmailTime(raw: string | null | undefined): string {
  const v = raw?.trim() ?? "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  if (!m) return "11:30";
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return "11:30";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseAlertEmailTimezone(raw: string | null | undefined): string {
  const v = raw?.trim();
  if (v && TIMEZONE_SET.has(v)) return v;
  return "Asia/Kolkata";
}

export function localTimeParts(
  d: Date,
  timeZone: string,
): { hour: number; minute: number; dateKey: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;
  return { hour, minute, dateKey };
}

export function localDateKey(d: Date, timeZone: string): string {
  return localTimeParts(d, timeZone).dateKey;
}

/** ISO weekday 1=Mon … 7=Sun in the given timezone. */
export function isoWeekdayInTimezone(d: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(d);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[short] ?? 1;
}

/** Monday of the ISO week containing `d` (in org timezone, returned as UTC midnight of that date). */
function mondayOfWeekInTimezone(d: Date, timeZone: string): string {
  const { dateKey } = localTimeParts(d, timeZone);
  const [y, m, day] = dateKey.split("-").map(Number);
  const wd = isoWeekdayInTimezone(d, timeZone);
  const mondayDay = day - (wd - 1);
  const monday = new Date(Date.UTC(y, m - 1, mondayDay));
  return monday.toISOString().slice(0, 10);
}

function weeksSinceEpochMondayInTimezone(d: Date, timeZone: string): number {
  const monKey = mondayOfWeekInTimezone(d, timeZone);
  const mon = new Date(`${monKey}T00:00:00Z`);
  const DAY_MS = 1000 * 60 * 60 * 24;
  return Math.floor(mon.getTime() / (7 * DAY_MS));
}

export function weeksSinceEpochMondayForTz(d: Date, timeZone: string): number {
  return weeksSinceEpochMondayInTimezone(d, timeZone);
}

/**
 * True when the current moment falls in [configured time, configured time + window).
 * Used when ALERT_CRON_IS_DAILY is false (Pro+ sub-daily cron).
 */
export function isWithinSendWindow(
  now: Date,
  timeHHMM: string,
  timeZone: string,
  windowMinutes = ALERT_CRON_WINDOW_MINUTES,
): boolean {
  const [th, tm] = parseAlertEmailTime(timeHHMM).split(":").map(Number);
  const targetMinutes = th * 60 + tm;
  const local = localTimeParts(now, timeZone);
  const nowMinutes = local.hour * 60 + local.minute;
  return nowMinutes >= targetMinutes && nowMinutes < targetMinutes + windowMinutes;
}
