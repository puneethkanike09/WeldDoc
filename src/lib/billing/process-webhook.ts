import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapEventToOrgUpdate,
  type RazorpayWebhookEvent,
} from "@/lib/billing/webhook";

export interface ProcessResult {
  status: "processed" | "duplicate" | "ignored" | "unmatched";
  orgId?: string;
  subscriptionId?: string | null;
}

/**
 * Idempotently apply a verified Razorpay webhook event to org billing state.
 *
 * 1. Insert the event id into billing_events (unique) — duplicate delivery is a
 *    no-op (Razorpay retries until it gets a 2xx).
 * 2. Resolve the org by razorpay_subscription_id.
 * 3. Apply the mapped column patch via the service-role client.
 *
 * The caller MUST have already verified the signature.
 */
export async function processRazorpayWebhook(
  supabase: SupabaseClient,
  eventId: string,
  event: RazorpayWebhookEvent,
): Promise<ProcessResult> {
  const { subscriptionId, update } = mapEventToOrgUpdate(event);

  // Idempotency guard: unique razorpay_event_id. If the insert conflicts, we've
  // seen this delivery already.
  const { error: insertError } = await supabase.from("billing_events").insert({
    razorpay_event_id: eventId,
    event_type: event.event ?? "unknown",
    razorpay_subscription_id: subscriptionId,
    payload: event as unknown as Record<string, unknown>,
  });

  if (insertError) {
    // 23505 = unique_violation => already processed.
    if ((insertError as { code?: string }).code === "23505") {
      return { status: "duplicate", subscriptionId };
    }
    throw new Error(insertError.message);
  }

  if (!update) return { status: "ignored", subscriptionId };
  if (!subscriptionId) return { status: "unmatched", subscriptionId };

  const { data: org, error: findError } = await supabase
    .from("organizations")
    .select("id")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!org) return { status: "unmatched", subscriptionId };

  const { error: updateError } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", org.id);
  if (updateError) throw new Error(updateError.message);

  // Backfill org_id on the audit row now that we've resolved it.
  await supabase
    .from("billing_events")
    .update({ org_id: org.id })
    .eq("razorpay_event_id", eventId);

  return { status: "processed", orgId: org.id, subscriptionId };
}
