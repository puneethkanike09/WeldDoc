import type { Organization, PlanTier, SubscriptionStatus } from "@/types/db";

/**
 * Pure access-control resolver. Given an org's billing state, decides whether
 * the org currently has write access and why. Deterministic (accepts `now`) so
 * it is fully unit-testable.
 *
 * canWrite is true when ANY of:
 *  - billing_exempt (superadmin override for test/internal orgs)
 *  - status active
 *  - status past_due (grace period while Razorpay retries the charge)
 *  - status trialing AND now < trial_ends_at
 *  - status cancelled AND now < current_period_end (paid through the cycle end)
 * Everything else (expired, halted, trial elapsed, cancelled past period) is
 * read-only.
 */

export type AccessReason =
  | "exempt"
  | "active"
  | "grace_past_due"
  | "trial_active"
  | "cancelled_grace"
  | "trial_expired"
  | "subscription_expired"
  | "subscription_halted"
  | "cancelled_expired"
  | "no_subscription";

export interface OrgAccess {
  canWrite: boolean;
  tier: PlanTier;
  status: SubscriptionStatus;
  reason: AccessReason;
  billingExempt: boolean;
  /** Whole days left in the trial (>= 0), or null when not trialing. */
  trialDaysLeft: number | null;
  /** True when read-only specifically because the trial elapsed. */
  isTrialExpired: boolean;
}

type OrgBillingFields = Pick<
  Organization,
  | "plan_tier"
  | "subscription_status"
  | "trial_ends_at"
  | "current_period_end"
  | "billing_exempt"
>;

const MS_PER_DAY = 86_400_000;

function toTime(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function trialDaysLeft(trialEnd: number | null, nowMs: number): number | null {
  if (trialEnd == null) return null;
  return Math.max(0, Math.ceil((trialEnd - nowMs) / MS_PER_DAY));
}

export function getOrgAccess(org: OrgBillingFields, now: Date = new Date()): OrgAccess {
  const nowMs = now.getTime();
  const tier = org.plan_tier ?? "starter";
  const status = org.subscription_status ?? "trialing";
  const trialEnd = toTime(org.trial_ends_at);
  const periodEnd = toTime(org.current_period_end);

  const base = {
    tier,
    status,
    billingExempt: Boolean(org.billing_exempt),
    trialDaysLeft: status === "trialing" ? trialDaysLeft(trialEnd, nowMs) : null,
    isTrialExpired: false,
  };

  if (org.billing_exempt) {
    return { ...base, canWrite: true, reason: "exempt" };
  }

  switch (status) {
    case "active":
      return { ...base, canWrite: true, reason: "active" };

    case "past_due":
      // Razorpay is still retrying — keep write access during the grace window.
      return { ...base, canWrite: true, reason: "grace_past_due" };

    case "trialing": {
      const withinTrial = trialEnd != null && nowMs < trialEnd;
      if (withinTrial) {
        return { ...base, canWrite: true, reason: "trial_active" };
      }
      return {
        ...base,
        canWrite: false,
        reason: trialEnd == null ? "no_subscription" : "trial_expired",
        isTrialExpired: trialEnd != null,
      };
    }

    case "cancelled": {
      const withinPaid = periodEnd != null && nowMs < periodEnd;
      if (withinPaid) {
        return { ...base, canWrite: true, reason: "cancelled_grace" };
      }
      return { ...base, canWrite: false, reason: "cancelled_expired" };
    }

    case "halted":
      return { ...base, canWrite: false, reason: "subscription_halted" };

    case "expired":
      return { ...base, canWrite: false, reason: "subscription_expired" };

    default:
      return { ...base, canWrite: false, reason: "no_subscription" };
  }
}

/** Convenience predicate used by enforcement chokepoints. */
export function orgCanWrite(org: OrgBillingFields, now?: Date): boolean {
  return getOrgAccess(org, now).canWrite;
}

/** User-facing message for a read-only org, tailored to why access is blocked. */
export function readOnlyMessage(access: OrgAccess): string {
  switch (access.reason) {
    case "trial_expired":
      return "Your free trial has ended. Subscribe to a plan to continue adding and editing records.";
    case "cancelled_expired":
      return "Your subscription has ended. Renew your plan to regain full access.";
    case "subscription_halted":
      return "Your subscription is on hold due to a failed payment. Update your payment method to continue.";
    case "subscription_expired":
      return "Your subscription has expired. Subscribe to a plan to continue.";
    default:
      return "Your account is read-only. Subscribe to a plan to add or edit records.";
  }
}
