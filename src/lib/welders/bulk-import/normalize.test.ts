import { describe, expect, it } from "vitest";
import { coerceDate, coerceDateHistory } from "./normalize";

describe("coerceDate DD-Mon-YY (plant style)", () => {
  it("parses 02-Aug-25 → 2025-08-02", () => {
    expect(coerceDate("02-Aug-25")).toBe("2025-08-02");
  });

  it("parses full and short month names with 2-digit year", () => {
    expect(coerceDate("12-Mar-24")).toBe("2024-03-12");
    expect(coerceDate("20-Feb-24")).toBe("2024-02-20");
    expect(coerceDate("29-Jan-26")).toBe("2026-01-29");
    expect(coerceDate("20-Jul-26")).toBe("2026-07-20");
  });

  it("parses 4-digit year DD-Mon-YYYY", () => {
    expect(coerceDate("02-Aug-2025")).toBe("2025-08-02");
  });

  it("uses 70+ pivot for century (20-May-88 → 1988)", () => {
    expect(coerceDate("20-May-88")).toBe("1988-05-20");
  });

  it("keeps existing formats working", () => {
    expect(coerceDate("2024-06-15")).toBe("2024-06-15");
    expect(coerceDate("15/06/2024")).toBe("2024-06-15");
    expect(coerceDate("10 May 2023")).toBe("2023-05-10");
  });
});

describe("coerceDateHistory with DD-Mon-YY", () => {
  it("normalizes semicolon lists to ISO", () => {
    expect(
      coerceDateHistory("02-Aug-25;01-Aug-25;29-Jan-26;20-Jul-26"),
    ).toBe("2025-08-02;2025-08-01;2026-01-29;2026-07-20");
  });

  it("accepts mixed ISO and plant dates", () => {
    expect(coerceDateHistory("2025-08-02;01-Aug-25")).toBe(
      "2025-08-02;2025-08-01",
    );
  });
});
