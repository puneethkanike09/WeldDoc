import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mapEventToOrgUpdate,
  verifyRazorpaySignature,
  type RazorpayWebhookEvent,
} from "./webhook";

const SECRET = "whsec_test_123";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyRazorpaySignature", () => {
  it("accepts a valid signature", () => {
    const body = JSON.stringify({ event: "subscription.charged" });
    expect(verifyRazorpaySignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ event: "subscription.charged" });
    const sig = sign(body);
    expect(verifyRazorpaySignature(body + "x", sig, SECRET)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    const body = "{}";
    expect(verifyRazorpaySignature(body, sign(body, "other"), SECRET)).toBe(
      false,
    );
  });

  it("rejects missing signature or secret", () => {
    expect(verifyRazorpaySignature("{}", null, SECRET)).toBe(false);
    expect(verifyRazorpaySignature("{}", sign("{}"), undefined)).toBe(false);
  });
});

describe("mapEventToOrgUpdate", () => {
  const CURRENT_END = 1_784_000_000; // fixed unix seconds
  const CURRENT_END_ISO = new Date(CURRENT_END * 1000).toISOString();

  beforeEach(() => {
    process.env.RAZORPAY_PLAN_GROWTH = "plan_growth_2026";
    process.env.RAZORPAY_PLAN_ENTERPRISE = "plan_ent_2026";
  });
  afterEach(() => {
    delete process.env.RAZORPAY_PLAN_GROWTH;
    delete process.env.RAZORPAY_PLAN_ENTERPRISE;
  });

  function event(
    name: string,
    entity: Record<string, unknown> = {},
  ): RazorpayWebhookEvent {
    return {
      event: name,
      payload: {
        subscription: {
          entity: {
            id: "sub_abc",
            plan_id: "plan_growth_2026",
            current_end: CURRENT_END,
            ...entity,
          },
        },
      },
    };
  }

  it("subscription.activated => active + period end + resolved tier", () => {
    const { subscriptionId, update } = mapEventToOrgUpdate(
      event("subscription.activated"),
    );
    expect(subscriptionId).toBe("sub_abc");
    expect(update?.subscription_status).toBe("active");
    expect(update?.current_period_end).toBe(CURRENT_END_ISO);
    expect(update?.plan_tier).toBe("growth");
    expect(update?.razorpay_plan_id).toBe("plan_growth_2026");
    expect(update?.subscription_cancel_at_period_end).toBe(false);
  });

  it("subscription.charged => active", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.charged")).update
        ?.subscription_status,
    ).toBe("active");
  });

  it("subscription.pending => past_due", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.pending")).update
        ?.subscription_status,
    ).toBe("past_due");
  });

  it("subscription.halted => halted", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.halted")).update
        ?.subscription_status,
    ).toBe("halted");
  });

  it("subscription.paused => halted (read-only)", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.paused")).update
        ?.subscription_status,
    ).toBe("halted");
  });

  it("subscription.cancelled => cancelled + cancel_at_period_end + period end", () => {
    const { update } = mapEventToOrgUpdate(event("subscription.cancelled"));
    expect(update?.subscription_status).toBe("cancelled");
    expect(update?.subscription_cancel_at_period_end).toBe(true);
    expect(update?.current_period_end).toBe(CURRENT_END_ISO);
  });

  it("subscription.completed => expired", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.completed")).update
        ?.subscription_status,
    ).toBe("expired");
  });

  it("subscription.resumed => active", () => {
    expect(
      mapEventToOrgUpdate(event("subscription.resumed")).update
        ?.subscription_status,
    ).toBe("active");
  });

  it("unknown event => null update, still returns subscription id", () => {
    const { subscriptionId, update } = mapEventToOrgUpdate(
      event("payment.captured"),
    );
    expect(subscriptionId).toBe("sub_abc");
    expect(update).toBeNull();
  });

  it("handles missing subscription entity gracefully", () => {
    const { subscriptionId, update } = mapEventToOrgUpdate({
      event: "subscription.activated",
      payload: {},
    });
    expect(subscriptionId).toBeNull();
    expect(update?.subscription_status).toBe("active");
  });

  it("enterprise plan id resolves to enterprise tier", () => {
    const { update } = mapEventToOrgUpdate(
      event("subscription.activated", { plan_id: "plan_ent_2026" }),
    );
    expect(update?.plan_tier).toBe("enterprise");
  });
});
