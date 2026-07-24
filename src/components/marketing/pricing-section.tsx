"use client";

import { Check } from "lucide-react";
import { DsButtonLink } from "@/components/marketing/ds-button";
import { ElectricBorder } from "@/components/marketing/electric-border";
import { PLANS, UNLIMITED, type PlanDefinition } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type PricingSectionProps = {
  id?: string;
  className?: string;
};

const FEATURED_BORDER_RADIUS = 16;
const FEATURED_GLOW = "#f5d4a0";

function PlanCard({ plan, featured }: { plan: PlanDefinition; featured: boolean }) {
  const card = (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl p-8",
        featured
          ? "bg-brand-red text-ink shadow-(--shadow-lift)"
          : "border border-brand-red/15 bg-pale-green",
      )}
    >
      <div className="flex items-center gap-3">
        <h3 className="font-ds-display text-[22px] font-semibold text-ink">
          {plan.name}
        </h3>
        {featured && (
          <span className="rounded-full bg-deep-green px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-white">
            Most popular
          </span>
        )}
      </div>
      <p className="mt-4">
        <span className="font-ds-display text-[34px] font-semibold text-ink">
          {plan.priceLabel}
        </span>{" "}
        <span className={featured ? "text-ink/65" : "text-muted-slate"}>
          {plan.cadenceLabel}
        </span>
      </p>
      <p className="mt-2 text-body font-medium text-ink">
        {plan.welderLimit === UNLIMITED
          ? "Unlimited welders / operators"
          : `Up to ${plan.welderLimit} welders / operators`}
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.highlights.map((h) => (
          <li
            key={h}
            className={cn(
              "flex items-start gap-2.5 text-body",
              featured ? "text-ink/85" : "text-slate",
            )}
          >
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                featured ? "text-deep-green" : "text-brand-red",
              )}
              strokeWidth={2.5}
            />
            {h}
          </li>
        ))}
      </ul>
      <div className="mt-8">
        {plan.tier === "starter" ? (
          <DsButtonLink href="/login" variant="primary">
            Start free trial
          </DsButtonLink>
        ) : (
          <span
            className={cn(
              "inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-pill px-6 py-3 text-button opacity-70",
              featured ? "bg-deep-green text-white" : "bg-onyx/10 text-ink",
            )}
          >
            Coming soon
          </span>
        )}
      </div>
    </div>
  );

  if (!featured) {
    return card;
  }

  return (
    <ElectricBorder
      color={FEATURED_GLOW}
      speed={1}
      chaos={0.12}
      borderRadius={FEATURED_BORDER_RADIUS}
      className="h-full"
      style={{ borderRadius: FEATURED_BORDER_RADIUS }}
    >
      {card}
    </ElectricBorder>
  );
}

export function PricingSection({
  id = "pricing",
  className = "section-y bg-canvas",
}: PricingSectionProps) {
  return (
    <section id={id} className={cn("overflow-x-clip", className)}>
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="max-w-[640px]">
          <p className="text-mono-label text-brand-red">Pricing</p>
          <h2 className="text-section-heading mt-4">
            Simple plans that scale with your shop
          </h2>
          <p className="text-body-large mt-5 text-slate">
            Start free for a month — no card required. Paid plans are coming
            soon; sign up now to try the full product on Starter.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {PLANS.map((plan) => {
            const featured = plan.tier === "growth";
            return (
              <div
                key={plan.tier}
                className={cn(
                  "h-full overflow-x-clip",
                  featured && "px-1 py-2 md:px-2",
                )}
              >
                <PlanCard plan={plan} featured={featured} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
