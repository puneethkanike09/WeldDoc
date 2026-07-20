"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { billingWhatsAppUrl } from "@/lib/brochure/regions";
import { PLANS, UNLIMITED } from "@/lib/billing/plans";
import type { PlanTier, SubscriptionStatus } from "@/types/db";
import {
  cancelSubscription,
  createSubscriptionCheckout,
} from "@/app/(app)/settings/billing-actions";

interface RazorpayCheckoutOptions {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  handler?: (response: unknown) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}
interface RazorpayInstance {
  open: () => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment retrying",
  halted: "On hold",
  cancelled: "Cancelling",
  expired: "Expired",
};

const STATUS_TONE: Record<SubscriptionStatus, string> = {
  trialing: "bg-frost text-charcoal",
  active: "bg-emerald-100 text-emerald-800",
  past_due: "bg-amber-100 text-amber-800",
  halted: "bg-amber-100 text-amber-800",
  cancelled: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
};

export interface BillingPanelProps {
  currentTier: PlanTier;
  status: SubscriptionStatus;
  canWrite: boolean;
  trialDaysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  billingExempt: boolean;
  paymentsConfigured: boolean;
  hasSubscription: boolean;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function BillingPanel(props: BillingPanelProps) {
  const [checkoutTier, setCheckoutTier] = useState<PlanTier | null>(null);
  const [cancelPending, startCancel] = useTransition();

  const subscribe = useCallback(async (tier: PlanTier) => {
    setCheckoutTier(tier);
    try {
      const result = await createSubscriptionCheckout(tier);
      const ok = await loadCheckoutScript();
      if (!ok || !window.Razorpay) {
        // Fall back to the hosted subscription page.
        if (result.shortUrl) {
          window.location.href = result.shortUrl;
          return;
        }
        throw new Error("Could not open the payment window.");
      }
      const rzp = new window.Razorpay({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        name: "Weld.Doc",
        description: `${result.planName} subscription`,
        theme: { color: "#132537" },
        handler: () => {
          toast.success(
            "Payment authorised. Your plan will activate momentarily.",
          );
          setTimeout(() => window.location.reload(), 2500);
        },
        modal: {
          ondismiss: () => setCheckoutTier(null),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
      setCheckoutTier(null);
    }
  }, []);

  const doCancel = useCallback(() => {
    if (
      !window.confirm(
        "Cancel your subscription? You keep full access until the end of the current billing period.",
      )
    ) {
      return;
    }
    startCancel(async () => {
      try {
        await cancelSubscription();
        toast.success("Subscription will end at the current period.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not cancel subscription.",
        );
      }
    });
  }, []);

  const periodEnd = fmtDate(props.currentPeriodEnd);

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-graphite">Current plan</p>
              <div className="flex items-center gap-3">
                <span className="font-display text-xl font-semibold text-onyx">
                  {PLANS.find((p) => p.tier === props.currentTier)?.name ??
                    "Starter"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_TONE[props.status],
                  )}
                >
                  {STATUS_LABEL[props.status]}
                </span>
                {props.billingExempt && (
                  <span className="rounded-full bg-frost px-2.5 py-0.5 text-xs font-medium text-charcoal">
                    Complimentary
                  </span>
                )}
              </div>
            </div>
            {props.hasSubscription &&
              !props.cancelAtPeriodEnd &&
              props.status !== "expired" &&
              !props.billingExempt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={doCancel}
                  disabled={cancelPending}
                >
                  {cancelPending ? "Cancelling…" : "Cancel subscription"}
                </Button>
              )}
          </div>

          {props.status === "trialing" && props.trialDaysLeft != null && (
            <p className="text-sm text-graphite">
              {props.trialDaysLeft > 0
                ? `${props.trialDaysLeft} day(s) left in your free trial.`
                : "Your free trial has ended."}
            </p>
          )}
          {props.cancelAtPeriodEnd && periodEnd && (
            <p className="text-sm text-amber-700">
              Your subscription is set to end on {periodEnd}. You keep full
              access until then.
            </p>
          )}
          {!props.cancelAtPeriodEnd &&
            props.status === "active" &&
            periodEnd && (
              <p className="text-sm text-graphite">Renews on {periodEnd}.</p>
            )}
          {!props.canWrite && !props.billingExempt && (
            <p className="rounded-button bg-red-50 px-3 py-2 text-sm text-red-800">
              Your account is currently read-only. Subscribe to a plan below to
              restore full access.
            </p>
          )}
          {!props.paymentsConfigured && (
            <p className="text-sm text-graphite">
              Online payments are coming soon. Contact us on WhatsApp to
              subscribe in the meantime.
            </p>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === props.currentTier;
          const isStarter = plan.tier === "starter";
          const loading = checkoutTier === plan.tier;
          return (
            <Card
              key={plan.tier}
              className={cn(isCurrent && "ring-2 ring-onyx")}
            >
              <CardBody className="flex h-full flex-col gap-4">
                <div className="space-y-1">
                  <p className="font-display text-lg font-semibold text-onyx">
                    {plan.name}
                  </p>
                  <p className="text-2xl font-semibold text-onyx">
                    {plan.priceLabel}
                    <span className="ml-1 text-sm font-normal text-graphite">
                      {plan.cadenceLabel}
                    </span>
                  </p>
                  <p className="text-sm text-graphite">
                    {plan.welderLimit === UNLIMITED
                      ? "Unlimited welders / operators"
                      : `Up to ${plan.welderLimit} welders / operators`}
                  </p>
                </div>
                <ul className="flex-1 space-y-2 text-sm text-graphite">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                      {h}
                    </li>
                  ))}
                </ul>
                {isStarter ? (
                  <Button variant="ghost" size="sm" disabled>
                    {isCurrent ? "Current plan" : "Free trial"}
                  </Button>
                ) : !props.paymentsConfigured ? (
                  isCurrent && props.status === "active" ? (
                    <Button variant="ghost" size="sm" disabled>
                      Current plan
                    </Button>
                  ) : props.billingExempt ? (
                    <Button variant="primary" size="sm" disabled>
                      Contact us
                    </Button>
                  ) : (
                    <ButtonLink
                      href={billingWhatsAppUrl(plan.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                      size="sm"
                    >
                      Contact us
                    </ButtonLink>
                  )
                ) : (
                  <Button
                    variant={isCurrent ? "ghost" : "primary"}
                    size="sm"
                    disabled={
                      loading ||
                      props.billingExempt ||
                      (isCurrent && props.status === "active")
                    }
                    onClick={() => subscribe(plan.tier)}
                  >
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {isCurrent && props.status === "active"
                      ? "Current plan"
                      : isCurrent
                        ? "Reactivate"
                        : "Subscribe"}
                  </Button>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
