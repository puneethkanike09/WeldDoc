"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSession } from "@/lib/auth";
import type { PlanTier } from "@/types/db";
import {
  cancelSubscription as razorpayCancel,
  createSubscription,
  ensureCustomer,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/billing/razorpay";
import { currentRazorpayPlanId, getPlan } from "@/lib/billing/plans";

export interface CheckoutResult {
  subscriptionId: string;
  shortUrl: string | null;
  keyId: string;
  planName: string;
}

/**
 * Create (or reuse a customer for) a Razorpay subscription for the org's chosen
 * paid tier and return the details the client needs to open Razorpay Checkout.
 *
 * NOTE: uses requireSession (not requireWritableSession) on purpose — a
 * read-only org (expired trial) MUST still be able to subscribe.
 */
export async function createSubscriptionCheckout(
  tier: PlanTier,
): Promise<CheckoutResult> {
  if (tier === "starter") {
    throw new Error("Starter is the free trial and has no subscription.");
  }
  if (!razorpayConfigured()) {
    throw new Error("Payments are not configured. Please contact support.");
  }

  const planId = currentRazorpayPlanId(tier);
  if (!planId) {
    throw new Error(`No Razorpay plan configured for the ${tier} tier.`);
  }

  const { org, email } = await requireSession();
  // Billing columns are service-role only (see 0034 RLS migration).
  const supabase = createAdminClient();

  const customerId = await ensureCustomer({
    orgId: org.id,
    orgName: org.name,
    email,
    existingCustomerId: org.razorpay_customer_id,
  });

  const subscription = await createSubscription({
    planId,
    customerId,
    orgId: org.id,
  });

  // Persist identifiers now. The subscription only becomes "active" once the
  // webhook (subscription.activated / charged) fires — we don't grant access here.
  const { error } = await supabase
    .from("organizations")
    .update({
      razorpay_customer_id: customerId,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: planId,
    })
    .eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");

  const keyId = razorpayKeyId();
  if (!keyId) throw new Error("Razorpay key id missing.");

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as { short_url?: string }).short_url ?? null,
    keyId,
    planName: getPlan(tier).name,
  };
}

/**
 * Cancel the org's subscription at the end of the current billing cycle. Write
 * access is retained until current_period_end; the webhook finalizes state.
 */
export async function cancelSubscription(): Promise<void> {
  const { org } = await requireSession();
  const supabase = createAdminClient();

  if (!org.razorpay_subscription_id) {
    throw new Error("No active subscription to cancel.");
  }
  if (!razorpayConfigured()) {
    throw new Error("Payments are not configured. Please contact support.");
  }

  await razorpayCancel(org.razorpay_subscription_id, true);

  const { error } = await supabase
    .from("organizations")
    .update({ subscription_cancel_at_period_end: true })
    .eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
