/** UTC calendar helpers for ISO date-only strings (YYYY-MM-DD). */

export function parseISODate(input: string | Date): Date {
  if (input instanceof Date) {
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
    );
  }
  const s = input.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return new Date(s);
}

export function formatISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addCalendarMonths(base: Date, months: number): Date {
  const d = new Date(base.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function subtractCalendarDay(d: Date): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() - 1);
  return r;
}

/** Add calendar months; optionally end one day before the anniversary (initial validity). */
export function addPeriodFromISODate(
  isoDate: string,
  months: number,
  minusOneDay: boolean,
): string {
  let d = addCalendarMonths(parseISODate(isoDate), months);
  if (minusOneDay) d = subtractCalendarDay(d);
  return formatISODate(d);
}
