import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { processRazorpayWebhook } from "./process-webhook";
import type { RazorpayWebhookEvent } from "./webhook";

/**
 * Minimal chainable fake of the Supabase client covering the exact calls
 * processRazorpayWebhook makes. Records org updates for assertions.
 */
function makeFakeSupabase(opts: {
  existingEventIds?: Set<string>;
  orgBySubscription?: Record<string, string>;
}) {
  const seenEvents = new Set(opts.existingEventIds ?? []);
  const orgUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];

  const client = {
    from(table: string) {
      if (table === "billing_events") {
        return {
          insert(row: { razorpay_event_id: string }) {
            if (seenEvents.has(row.razorpay_event_id)) {
              return Promise.resolve({ error: { code: "23505" } });
            }
            seenEvents.add(row.razorpay_event_id);
            return Promise.resolve({ error: null });
          },
          update() {
            return { eq: () => Promise.resolve({ error: null }) };
          },
        };
      }
      if (table === "organizations") {
        return {
          select() {
            return {
              eq(_col: string, value: string) {
                return {
                  maybeSingle() {
                    const id = opts.orgBySubscription?.[value];
                    return Promise.resolve({
                      data: id ? { id } : null,
                      error: null,
                    });
                  },
                };
              },
            };
          },
          update(patch: Record<string, unknown>) {
            return {
              eq(_col: string, id: string) {
                orgUpdates.push({ id, patch });
                return Promise.resolve({ error: null });
              },
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };

  return { client: client as never, orgUpdates, seenEvents };
}

const activated: RazorpayWebhookEvent = {
  event: "subscription.activated",
  payload: {
    subscription: {
      entity: { id: "sub_1", plan_id: "plan_x", current_end: 1_784_000_000 },
    },
  },
};

describe("processRazorpayWebhook", () => {
  beforeEach(() => {
    process.env.RAZORPAY_PLAN_GROWTH = "plan_growth";
  });
  afterEach(() => {
    delete process.env.RAZORPAY_PLAN_GROWTH;
  });

  it("applies the org update for a new event", async () => {
    const fake = makeFakeSupabase({
      orgBySubscription: { sub_1: "org_1" },
    });
    const res = await processRazorpayWebhook(fake.client, "evt_1", activated);
    expect(res.status).toBe("processed");
    expect(res.orgId).toBe("org_1");
    expect(fake.orgUpdates).toHaveLength(1);
    expect(fake.orgUpdates[0].patch.subscription_status).toBe("active");
  });

  it("is idempotent: duplicate event id makes no org update", async () => {
    const fake = makeFakeSupabase({
      existingEventIds: new Set(["evt_dup"]),
      orgBySubscription: { sub_1: "org_1" },
    });
    const res = await processRazorpayWebhook(fake.client, "evt_dup", activated);
    expect(res.status).toBe("duplicate");
    expect(fake.orgUpdates).toHaveLength(0);
  });

  it("ignored event type records audit row but no update", async () => {
    const fake = makeFakeSupabase({ orgBySubscription: { sub_1: "org_1" } });
    const res = await processRazorpayWebhook(fake.client, "evt_2", {
      event: "payment.captured",
      payload: { subscription: { entity: { id: "sub_1" } } },
    });
    expect(res.status).toBe("ignored");
    expect(fake.orgUpdates).toHaveLength(0);
  });

  it("unmatched subscription id => no update", async () => {
    const fake = makeFakeSupabase({ orgBySubscription: {} });
    const res = await processRazorpayWebhook(fake.client, "evt_3", activated);
    expect(res.status).toBe("unmatched");
    expect(fake.orgUpdates).toHaveLength(0);
  });
});
