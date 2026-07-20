import type { Organization, PlanTier } from "@/types/db";

/**
 * Plan registry — single source of truth for pricing tiers, welder/operator
 * limits, and the Razorpay plan IDs that map onto them.
 *
 * Future-proofing: when a price changes you create a NEW Razorpay plan and add
 * its id to the matching tier's `razorpayPlanIds` array. Existing subscribers
 * keep their old plan id (still resolves to the same tier/limits); new
 * checkouts use `currentRazorpayPlanId`. Tiers and limits never change id.
 */

export const UNLIMITED = Number.POSITIVE_INFINITY;

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  /** Display price, e.g. "Free", "₹24,999". */
  priceLabel: string;
  /** Billing cadence label, e.g. "1 month free", "per year". */
  cadenceLabel: string;
  welderLimit: number;
  operatorLimit: number;
  /** Marketing bullet points (kept short; landing page owns richer copy). */
  highlights: string[];
  /**
   * Env var holding the current Razorpay plan id for self-serve checkout.
   * Starter has none (it is the free trial, no subscription).
   */
  planIdEnv?: "RAZORPAY_PLAN_GROWTH" | "RAZORPAY_PLAN_ENTERPRISE";
}

export const PLANS: readonly PlanDefinition[] = [
  {
    tier: "starter",
    name: "Starter",
    priceLabel: "Free",
    cadenceLabel: "1 month trial",
    welderLimit: 3,
    operatorLimit: 3,
    highlights: [
      "Up to 3 welders / operators",
      "Full product for 1 month",
      "No card required",
    ],
  },
  {
    tier: "growth",
    name: "Growth",
    priceLabel: "₹24,999",
    cadenceLabel: "per year",
    welderLimit: 20,
    operatorLimit: 20,
    highlights: [
      "Up to 20 welders / operators",
      "Everything in Starter",
      "Priority email support",
    ],
    planIdEnv: "RAZORPAY_PLAN_GROWTH",
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceLabel: "₹69,999",
    cadenceLabel: "per year",
    welderLimit: UNLIMITED,
    operatorLimit: UNLIMITED,
    highlights: [
      "Unlimited welders / operators",
      "Everything in Growth",
      "Dedicated onboarding",
    ],
    planIdEnv: "RAZORPAY_PLAN_ENTERPRISE",
  },
] as const;

export function getPlan(tier: PlanTier): PlanDefinition {
  const plan = PLANS.find((p) => p.tier === tier);
  // starter always exists; fall back to it for any unknown/legacy tier value.
  return plan ?? PLANS[0];
}

/**
 * Env-driven map of Razorpay plan id -> tier. Supports multiple ids per tier
 * so old (differently priced) plans keep resolving after a price change.
 *
 * Reads a comma-separated list so ops can retain historical ids, e.g.
 *   RAZORPAY_PLAN_GROWTH="plan_NEW,plan_OLD2024,plan_OLD2023"
 * The first entry is treated as the current checkout plan id.
 */
function planIdsFromEnv(
  envVar: NonNullable<PlanDefinition["planIdEnv"]>,
): string[] {
  return (process.env[envVar] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The Razorpay plan id to use for a NEW checkout of this tier (or null). */
export function currentRazorpayPlanId(tier: PlanTier): string | null {
  const plan = getPlan(tier);
  if (!plan.planIdEnv) return null;
  return planIdsFromEnv(plan.planIdEnv)[0] ?? null;
}

/**
 * Resolve a Razorpay plan id back to a tier. Unknown ids return null so the
 * caller can fall back to the org's stored `plan_tier`.
 */
export function resolvePlanByRazorpayId(planId: string | null): PlanTier | null {
  if (!planId) return null;
  for (const plan of PLANS) {
    if (!plan.planIdEnv) continue;
    if (planIdsFromEnv(plan.planIdEnv).includes(planId)) return plan.tier;
  }
  return null;
}

export interface OrgLimits {
  tier: PlanTier;
  welderLimit: number;
  operatorLimit: number;
}

/**
 * Effective limits for an org. Prefers the tier resolved from the live Razorpay
 * plan id (so a mislabeled `plan_tier` can't grant the wrong caps), then falls
 * back to the stored tier. Billing-exempt orgs get unlimited.
 */
export function limitsForOrg(
  org: Pick<Organization, "plan_tier" | "razorpay_plan_id" | "billing_exempt">,
): OrgLimits {
  if (org.billing_exempt) {
    return {
      tier: "enterprise",
      welderLimit: UNLIMITED,
      operatorLimit: UNLIMITED,
    };
  }
  const resolved = resolvePlanByRazorpayId(org.razorpay_plan_id);
  const tier = resolved ?? org.plan_tier ?? "starter";
  const plan = getPlan(tier);
  return {
    tier,
    welderLimit: plan.welderLimit,
    operatorLimit: plan.operatorLimit,
  };
}
