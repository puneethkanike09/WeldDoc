import { describe, expect, it } from "vitest";
import { getOrgAccess, orgCanWrite } from "./access";
import type { Organization } from "@/types/db";

type BillingFields = Pick<
  Organization,
  | "plan_tier"
  | "subscription_status"
  | "trial_ends_at"
  | "current_period_end"
  | "billing_exempt"
>;

const NOW = new Date("2026-07-20T00:00:00.000Z");

function org(overrides: Partial<BillingFields>): BillingFields {
  return {
    plan_tier: "starter",
    subscription_status: "trialing",
    trial_ends_at: null,
    current_period_end: null,
    billing_exempt: false,
    ...overrides,
  };
}

const iso = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * 86_400_000).toISOString();

describe("getOrgAccess", () => {
  it("billing_exempt always grants write, skipping trial/subscription", () => {
    const a = getOrgAccess(
      org({
        billing_exempt: true,
        subscription_status: "expired",
        trial_ends_at: iso(-100),
      }),
      NOW,
    );
    expect(a.canWrite).toBe(true);
    expect(a.reason).toBe("exempt");
    expect(a.billingExempt).toBe(true);
  });

  it("active subscription can write", () => {
    const a = getOrgAccess(
      org({ plan_tier: "growth", subscription_status: "active" }),
      NOW,
    );
    expect(a.canWrite).toBe(true);
    expect(a.reason).toBe("active");
  });

  it("past_due keeps write access during grace", () => {
    const a = getOrgAccess(
      org({ plan_tier: "growth", subscription_status: "past_due" }),
      NOW,
    );
    expect(a.canWrite).toBe(true);
    expect(a.reason).toBe("grace_past_due");
  });

  it("trialing with future trial_ends_at can write", () => {
    const a = getOrgAccess(
      org({ subscription_status: "trialing", trial_ends_at: iso(5) }),
      NOW,
    );
    expect(a.canWrite).toBe(true);
    expect(a.reason).toBe("trial_active");
    expect(a.trialDaysLeft).toBe(5);
  });

  it("trialing exactly at the boundary is expired (now === trial_ends_at)", () => {
    const a = getOrgAccess(
      org({ subscription_status: "trialing", trial_ends_at: iso(0) }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("trial_expired");
    expect(a.isTrialExpired).toBe(true);
    expect(a.trialDaysLeft).toBe(0);
  });

  it("trialing past the trial window is read-only", () => {
    const a = getOrgAccess(
      org({ subscription_status: "trialing", trial_ends_at: iso(-1) }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("trial_expired");
    expect(a.trialDaysLeft).toBe(0);
  });

  it("trialing with null trial_ends_at is read-only (no_subscription)", () => {
    const a = getOrgAccess(
      org({ subscription_status: "trialing", trial_ends_at: null }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("no_subscription");
    expect(a.isTrialExpired).toBe(false);
  });

  it("cancelled but still within paid period can write", () => {
    const a = getOrgAccess(
      org({
        plan_tier: "growth",
        subscription_status: "cancelled",
        current_period_end: iso(10),
      }),
      NOW,
    );
    expect(a.canWrite).toBe(true);
    expect(a.reason).toBe("cancelled_grace");
  });

  it("cancelled past the paid period is read-only", () => {
    const a = getOrgAccess(
      org({
        plan_tier: "growth",
        subscription_status: "cancelled",
        current_period_end: iso(-1),
      }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("cancelled_expired");
  });

  it("halted is read-only", () => {
    const a = getOrgAccess(
      org({ plan_tier: "growth", subscription_status: "halted" }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("subscription_halted");
  });

  it("expired is read-only", () => {
    const a = getOrgAccess(
      org({ plan_tier: "growth", subscription_status: "expired" }),
      NOW,
    );
    expect(a.canWrite).toBe(false);
    expect(a.reason).toBe("subscription_expired");
  });

  it("orgCanWrite mirrors getOrgAccess.canWrite", () => {
    const trialing = org({ subscription_status: "trialing", trial_ends_at: iso(3) });
    expect(orgCanWrite(trialing, NOW)).toBe(true);
    const expired = org({ subscription_status: "expired" });
    expect(orgCanWrite(expired, NOW)).toBe(false);
  });

  it("trialDaysLeft rounds up partial days", () => {
    const halfDay = new Date(NOW.getTime() + 43_200_000).toISOString();
    const a = getOrgAccess(
      org({ subscription_status: "trialing", trial_ends_at: halfDay }),
      NOW,
    );
    expect(a.trialDaysLeft).toBe(1);
  });
});
