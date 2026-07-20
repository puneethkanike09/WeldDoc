"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/billing/superadmin";
import { cancelSubscription as razorpayCancel } from "@/lib/billing/razorpay";
import type { PlanTier, SubscriptionStatus } from "@/types/db";

const TIERS: PlanTier[] = ["starter", "growth", "enterprise"];
const STATUSES: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "halted",
  "cancelled",
  "expired",
];

/** Toggle the billing_exempt flag (test/internal orgs bypass all billing gates). */
export async function setBillingExempt(orgId: string, exempt: boolean) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ billing_exempt: exempt })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Extend (or set) an org's trial to `days` from now and mark it trialing. */
export async function extendTrial(orgId: string, days: number) {
  await requireSuperAdmin();
  if (!Number.isFinite(days) || days <= 0 || days > 3650) {
    throw new Error("Enter a day count between 1 and 3650.");
  }
  const trialEnds = new Date(Date.now() + days * 86_400_000).toISOString();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ subscription_status: "trialing", trial_ends_at: trialEnds })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Manually override an org's plan tier and subscription status. */
export async function overridePlan(
  orgId: string,
  tier: PlanTier,
  status: SubscriptionStatus,
) {
  await requireSuperAdmin();
  if (!TIERS.includes(tier)) throw new Error("Invalid plan tier.");
  if (!STATUSES.includes(status)) throw new Error("Invalid status.");
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ plan_tier: tier, subscription_status: status })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/** Cancel an org's Razorpay subscription immediately (superadmin override). */
export async function forceCancelSubscription(orgId: string) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data: org, error: findErr } = await supabase
    .from("organizations")
    .select("razorpay_subscription_id")
    .eq("id", orgId)
    .single();
  if (findErr) throw new Error(findErr.message);
  if (!org?.razorpay_subscription_id) {
    throw new Error("Org has no Razorpay subscription.");
  }
  await razorpayCancel(org.razorpay_subscription_id, false);
  // Webhook will confirm; reflect immediately for the dashboard.
  const { error } = await supabase
    .from("organizations")
    .update({
      subscription_status: "cancelled",
      subscription_cancel_at_period_end: false,
    })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
