import { createHmac, timingSafeEqual } from "node:crypto";
import type { SubscriptionStatus } from "@/types/db";
import { resolvePlanByRazorpayId } from "@/lib/billing/plans";

/**
 * Verify a Razorpay webhook signature (HMAC-SHA256 of the raw request body,
 * hex-encoded) using a timing-safe comparison. `rawBody` MUST be the exact
 * bytes received — re-serialising parsed JSON will break the signature.
 */
export function verifyRazorpaySignature(
  rawBody: string,
  signature: string | null,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface RazorpaySubscriptionEntity {
  id?: string;
  plan_id?: string;
  status?: string;
  current_end?: number | null;
  end_at?: number | null;
}

export interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    subscription?: { entity?: RazorpaySubscriptionEntity };
  };
}

export interface OrgSubscriptionUpdate {
  subscription_status?: SubscriptionStatus;
  current_period_end?: string | null;
  razorpay_plan_id?: string;
  plan_tier?: "starter" | "growth" | "enterprise";
  subscription_cancel_at_period_end?: boolean;
}

export interface MappedEvent {
  /** Razorpay subscription id used to locate the org. Null => cannot route. */
  subscriptionId: string | null;
  /** Column patch to apply to organizations, or null to ignore the event. */
  update: OrgSubscriptionUpdate | null;
}

function unixToIso(sec: number | null | undefined): string | null {
  if (sec == null || !Number.isFinite(sec)) return null;
  return new Date(sec * 1000).toISOString();
}

/**
 * Translate a Razorpay subscription webhook into an organizations column patch.
 * Pure and deterministic for unit testing. Unhandled events return a null
 * update (the route logs the raw event but changes nothing).
 */
export function mapEventToOrgUpdate(event: RazorpayWebhookEvent): MappedEvent {
  const sub = event.payload?.subscription?.entity;
  const subscriptionId = sub?.id ?? null;
  const planId = sub?.plan_id ?? null;
  const periodEnd = unixToIso(sub?.current_end ?? sub?.end_at ?? null);

  const withPlan = (update: OrgSubscriptionUpdate): OrgSubscriptionUpdate => {
    if (planId) {
      update.razorpay_plan_id = planId;
      const tier = resolvePlanByRazorpayId(planId);
      if (tier) update.plan_tier = tier;
    }
    return update;
  };

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
    case "subscription.resumed":
      return {
        subscriptionId,
        update: withPlan({
          subscription_status: "active",
          current_period_end: periodEnd,
          subscription_cancel_at_period_end: false,
        }),
      };

    case "subscription.pending":
      return {
        subscriptionId,
        update: withPlan({ subscription_status: "past_due" }),
      };

    case "subscription.halted":
    case "subscription.paused":
      return {
        subscriptionId,
        update: withPlan({ subscription_status: "halted" }),
      };

    case "subscription.cancelled":
      return {
        subscriptionId,
        update: withPlan({
          subscription_status: "cancelled",
          current_period_end: periodEnd,
          subscription_cancel_at_period_end: true,
        }),
      };

    case "subscription.completed":
    case "subscription.expired":
      return {
        subscriptionId,
        update: withPlan({
          subscription_status: "expired",
          current_period_end: periodEnd,
        }),
      };

    default:
      return { subscriptionId, update: null };
  }
}
