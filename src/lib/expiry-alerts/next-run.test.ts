import { describe, expect, it } from "vitest";
import { calculateNextRun, zonedDateTimeToUtc } from "./next-run";
import { localTimeParts } from "./send-time";

describe("zonedDateTimeToUtc", () => {
  it("maps IST wall time to the correct UTC instant", () => {
    const utc = zonedDateTimeToUtc("2026-07-19", "08:00", "Asia/Kolkata");
    // IST = UTC+5:30 → 02:30 UTC
    expect(utc.toISOString()).toBe("2026-07-19T02:30:00.000Z");
    const local = localTimeParts(utc, "Asia/Kolkata");
    expect(local.dateKey).toBe("2026-07-19");
    expect(local.hour).toBe(8);
    expect(local.minute).toBe(0);
  });
});

describe("calculateNextRun", () => {
  it("daily upcoming uses today when send time is still ahead", () => {
    // 2026-07-18 07:00 IST = 01:30 UTC
    const from = new Date("2026-07-18T01:30:00.000Z");
    const next = calculateNextRun({
      frequency: "daily",
      timeHHMM: "08:00",
      timeZone: "Asia/Kolkata",
      from,
      strictlyAfter: false,
    });
    expect(next.toISOString()).toBe("2026-07-18T02:30:00.000Z");
  });

  it("daily strictlyAfter advances to next local day", () => {
    const from = new Date("2026-07-18T02:30:00.000Z"); // exactly 08:00 IST
    const next = calculateNextRun({
      frequency: "daily",
      timeHHMM: "08:00",
      timeZone: "Asia/Kolkata",
      from,
      strictlyAfter: true,
    });
    expect(next.toISOString()).toBe("2026-07-19T02:30:00.000Z");
  });

  it("every_2_days after send jumps two local days", () => {
    const from = new Date("2026-07-18T02:30:00.000Z");
    const next = calculateNextRun({
      frequency: "every_2_days",
      timeHHMM: "08:00",
      timeZone: "Asia/Kolkata",
      from,
      strictlyAfter: true,
    });
    expect(next.toISOString()).toBe("2026-07-20T02:30:00.000Z");
  });

  it("weekly picks next Monday at send time", () => {
    // Saturday 2026-07-18
    const from = new Date("2026-07-18T02:30:00.000Z");
    const next = calculateNextRun({
      frequency: "weekly",
      timeHHMM: "08:00",
      timeZone: "Asia/Kolkata",
      from,
      strictlyAfter: false,
    });
    // Monday 2026-07-20 08:00 IST
    expect(next.toISOString()).toBe("2026-07-20T02:30:00.000Z");
  });

  it("twice_weekly picks Thursday when after Monday", () => {
    // Monday 2026-07-20 08:00 IST — strictly after → Thursday
    const from = new Date("2026-07-20T02:30:00.000Z");
    const next = calculateNextRun({
      frequency: "twice_weekly",
      timeHHMM: "08:00",
      timeZone: "Asia/Kolkata",
      from,
      strictlyAfter: true,
    });
    expect(next.toISOString()).toBe("2026-07-23T02:30:00.000Z");
  });
});
