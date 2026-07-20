import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/billing/webhook";
import { processRazorpayWebhook } from "@/lib/billing/process-webhook";
import type { RazorpayWebhookEvent } from "@/lib/billing/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  // Raw body is REQUIRED for signature verification — parsing then
  // re-serialising would change the bytes and break the HMAC.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpaySignature(rawBody, signature, secret)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // Razorpay sends a per-delivery id in this header; fall back to a body field.
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    (event as { id?: string }).id ??
    `${event.event ?? "event"}:${signature}`;

  try {
    const supabase = createAdminClient();
    const result = await processRazorpayWebhook(supabase, eventId, event);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error("[razorpay-webhook] processing failed", err);
    // Return 500 so Razorpay retries delivery.
    return NextResponse.json(
      { received: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
