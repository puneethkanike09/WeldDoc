import Razorpay from "razorpay";

/**
 * Lazy, env-gated Razorpay client (mirrors getResendClient in src/lib/email.ts).
 * Returns null when keys are absent so local/dev without billing keys degrades
 * gracefully instead of throwing at import time.
 */
let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  if (!client) client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID ?? null;
}

class RazorpayNotConfiguredError extends Error {
  constructor() {
    super("Razorpay is not configured (missing RAZORPAY_KEY_ID / SECRET).");
    this.name = "RazorpayNotConfiguredError";
  }
}

function requireClient(): Razorpay {
  const c = getRazorpayClient();
  if (!c) throw new RazorpayNotConfiguredError();
  return c;
}

export interface EnsureCustomerInput {
  orgId: string;
  orgName: string;
  email?: string | null;
  existingCustomerId?: string | null;
}

/**
 * Return an existing Razorpay customer id or create one for the org.
 * `fail_existing: 0` makes create idempotent when the email already exists.
 */
export async function ensureCustomer(
  input: EnsureCustomerInput,
): Promise<string> {
  if (input.existingCustomerId) return input.existingCustomerId;
  const rzp = requireClient();
  const customer = await rzp.customers.create({
    name: input.orgName,
    email: input.email ?? undefined,
    fail_existing: 0,
    notes: { org_id: input.orgId },
  });
  return customer.id;
}

export interface CreateSubscriptionInput {
  planId: string;
  customerId: string;
  orgId: string;
  /** Total billing cycles to charge (default 5 years of annual billing). */
  totalCount?: number;
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const rzp = requireClient();
  return rzp.subscriptions.create({
    plan_id: input.planId,
    customer_notify: 1,
    total_count: input.totalCount ?? 5,
    notes: { org_id: input.orgId, customer_id: input.customerId },
  });
}

/**
 * Cancel a subscription. `atCycleEnd = true` keeps access until the paid period
 * ends; false cancels immediately.
 */
export async function cancelSubscription(
  subscriptionId: string,
  atCycleEnd = true,
) {
  const rzp = requireClient();
  return rzp.subscriptions.cancel(subscriptionId, atCycleEnd);
}

export async function fetchSubscription(subscriptionId: string) {
  const rzp = requireClient();
  return rzp.subscriptions.fetch(subscriptionId);
}
