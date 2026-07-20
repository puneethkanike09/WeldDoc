import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  currentRazorpayPlanId,
  getPlan,
  limitsForOrg,
  resolvePlanByRazorpayId,
  UNLIMITED,
} from "./plans";
import type { Organization } from "@/types/db";

const ENV_KEYS = ["RAZORPAY_PLAN_GROWTH", "RAZORPAY_PLAN_ENTERPRISE"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  process.env.RAZORPAY_PLAN_GROWTH = "plan_growth_2026,plan_growth_2025";
  process.env.RAZORPAY_PLAN_ENTERPRISE = "plan_ent_2026";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

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

describe("getPlan", () => {
  it("returns the requested tier definition", () => {
    expect(getPlan("growth").welderLimit).toBe(20);
    expect(getPlan("enterprise").welderLimit).toBe(UNLIMITED);
  });
});

describe("currentRazorpayPlanId", () => {
  it("returns the FIRST env id for a tier (current checkout plan)", () => {
    expect(currentRazorpayPlanId("growth")).toBe("plan_growth_2026");
    expect(currentRazorpayPlanId("enterprise")).toBe("plan_ent_2026");
  });

  it("returns null for starter (no subscription)", () => {
    expect(currentRazorpayPlanId("starter")).toBeNull();
  });
});

describe("resolvePlanByRazorpayId", () => {
  it("resolves current plan id to tier", () => {
    expect(resolvePlanByRazorpayId("plan_growth_2026")).toBe("growth");
    expect(resolvePlanByRazorpayId("plan_ent_2026")).toBe("enterprise");
  });

  it("resolves a HISTORICAL (old-price) id to the same tier", () => {
    expect(resolvePlanByRazorpayId("plan_growth_2025")).toBe("growth");
  });

  it("unknown id returns null (caller falls back to stored tier)", () => {
    expect(resolvePlanByRazorpayId("plan_unknown")).toBeNull();
    expect(resolvePlanByRazorpayId(null)).toBeNull();
  });
});

describe("limitsForOrg", () => {
  it("prefers the tier resolved from the live razorpay_plan_id", () => {
    const o = org({ plan_tier: "starter", razorpay_plan_id: "plan_growth_2026" });
    const l = limitsForOrg(o);
    expect(l.tier).toBe("growth");
    expect(l.welderLimit).toBe(20);
  });

  it("falls back to stored plan_tier when razorpay id is unknown/null", () => {
    const o = org({ plan_tier: "growth", razorpay_plan_id: null });
    expect(limitsForOrg(o).welderLimit).toBe(20);
  });

  it("billing_exempt => unlimited enterprise", () => {
    const o = org({ plan_tier: "starter", billing_exempt: true });
    const l = limitsForOrg(o);
    expect(l.tier).toBe("enterprise");
    expect(l.welderLimit).toBe(UNLIMITED);
    expect(l.operatorLimit).toBe(UNLIMITED);
  });

  it("defaults to starter for missing tier", () => {
    const o = org({ plan_tier: "starter" });
    expect(limitsForOrg(o).welderLimit).toBe(3);
  });
});
