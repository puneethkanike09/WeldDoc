import { describe, expect, it } from "vitest";
import { checkOperatorLimit, checkWelderLimit } from "./limits";
import type { Organization } from "@/types/db";

type LimitFields = Pick<
  Organization,
  "plan_tier" | "razorpay_plan_id" | "billing_exempt"
>;

function org(overrides: Partial<LimitFields>): LimitFields {
  return {
    plan_tier: "starter",
    razorpay_plan_id: null,
    billing_exempt: false,
    ...overrides,
  };
}

describe("checkWelderLimit / checkOperatorLimit", () => {
  it("starter caps welders at 3 (separate from operators)", () => {
    const o = org({ plan_tier: "starter" });
    expect(checkWelderLimit(o, 2).allowed).toBe(true);
    expect(checkWelderLimit(o, 3).allowed).toBe(false);
    // operators tracked independently, also capped at 3
    expect(checkOperatorLimit(o, 3).allowed).toBe(false);
  });

  it("boundary: at exactly the cap, adding one is blocked", () => {
    const o = org({ plan_tier: "growth" });
    const atCap = checkWelderLimit(o, 20, 1);
    expect(atCap.allowed).toBe(false);
    expect(atCap.remaining).toBe(0);
    const underCap = checkWelderLimit(o, 19, 1);
    expect(underCap.allowed).toBe(true);
    expect(underCap.remaining).toBe(1);
  });

  it("growth caps at 20 for both welders and operators", () => {
    const o = org({ plan_tier: "growth" });
    expect(checkWelderLimit(o, 20).allowed).toBe(false);
    expect(checkOperatorLimit(o, 19).allowed).toBe(true);
  });

  it("adding multiple respects the cap", () => {
    const o = org({ plan_tier: "growth" });
    expect(checkWelderLimit(o, 15, 5).allowed).toBe(true);
    expect(checkWelderLimit(o, 15, 6).allowed).toBe(false);
  });

  it("enterprise is unlimited", () => {
    const o = org({ plan_tier: "enterprise" });
    const c = checkWelderLimit(o, 100_000, 500);
    expect(c.allowed).toBe(true);
    expect(c.unlimited).toBe(true);
    expect(c.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it("billing_exempt is treated as unlimited regardless of tier", () => {
    const o = org({ plan_tier: "starter", billing_exempt: true });
    const c = checkWelderLimit(o, 9999);
    expect(c.allowed).toBe(true);
    expect(c.unlimited).toBe(true);
  });
});
