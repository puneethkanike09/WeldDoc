import type { Organization } from "@/types/db";
import { limitsForOrg, UNLIMITED } from "@/lib/billing/plans";

export interface LimitCheck {
  allowed: boolean;
  /** Current count of records. */
  current: number;
  /** Plan cap (Infinity when unlimited). */
  limit: number;
  /** How many more can be added (Infinity when unlimited, 0 when at/over cap). */
  remaining: number;
  unlimited: boolean;
}

type OrgLimitFields = Pick<
  Organization,
  "plan_tier" | "razorpay_plan_id" | "billing_exempt"
>;

/**
 * Checks whether `adding` more records keeps the org within its cap.
 * Welders and operators are counted separately (each has its own cap).
 */
function check(current: number, limit: number, adding: number): LimitCheck {
  const unlimited = limit === UNLIMITED;
  const remaining = unlimited ? UNLIMITED : Math.max(0, limit - current);
  return {
    allowed: unlimited || current + adding <= limit,
    current,
    limit,
    remaining,
    unlimited,
  };
}

export function checkWelderLimit(
  org: OrgLimitFields,
  currentCount: number,
  adding = 1,
): LimitCheck {
  return check(currentCount, limitsForOrg(org).welderLimit, adding);
}

export function checkOperatorLimit(
  org: OrgLimitFields,
  currentCount: number,
  adding = 1,
): LimitCheck {
  return check(currentCount, limitsForOrg(org).operatorLimit, adding);
}

export function welderLimitMessage(check: LimitCheck): string {
  return `Welder limit reached (${check.current}/${check.limit}). Upgrade your plan to add more welders.`;
}

export function operatorLimitMessage(check: LimitCheck): string {
  return `Operator limit reached (${check.current}/${check.limit}). Upgrade your plan to add more operators.`;
}
