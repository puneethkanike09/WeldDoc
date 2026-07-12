"use client";

import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormPending } from "@/lib/form-toast";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const QUALIFY_STEPS = [
  "Plan",
  "Test piece",
  "NDT / DT",
  "Certificate",
] as const;

export const invalidBorder = "border-ember ring-1 ring-ember/20";

export function QualifyHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-onyx">{title}</h3>
      <p className="mt-1 text-[14px] text-graphite">{sub}</p>
    </div>
  );
}

export function QualifySubmit({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  const pending = useFormPending();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export function QualifyStepper({
  step,
  maxStep,
  recordId,
  qualifyHref,
  recordQueryKey = "oq",
}: {
  step: number;
  maxStep: number;
  recordId: string | null;
  qualifyHref: string;
  recordQueryKey?: string;
}) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {QUALIFY_STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = recordId !== null && n <= maxStep && n !== step;
        const reachable = recordId !== null && n <= maxStep && n !== step;
        const content = (
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full font-display text-[13px] font-semibold",
                active && "bg-inverse-bg text-inverse-fg",
                done && "step-done",
                !active && !done && "bg-onyx/5 text-steel",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span
              className={cn(
                "text-[14px] font-medium",
                active ? "text-onyx" : "text-graphite",
              )}
            >
              {label}
            </span>
          </div>
        );
        const stepHref = `${qualifyHref}?${recordQueryKey}=${recordId}&step=${n}`;
        return (
          <div key={label} className="flex items-center gap-2">
            {reachable && !active ? (
              <Link
                href={stepHref}
                className="rounded-[10px] transition-colors hover:bg-frost/80"
                title={`Back to ${label}`}
              >
                {content}
              </Link>
            ) : (
              content
            )}
            {i < QUALIFY_STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-silver" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function QualifyContinueLink({
  qualifyHref,
  recordId,
  currentStep,
  maxStep,
  recordQueryKey = "oq",
}: {
  qualifyHref: string;
  recordId: string;
  currentStep: number;
  maxStep: number;
  recordQueryKey?: string;
}) {
  const next = currentStep + 1;
  if (next > maxStep || next > QUALIFY_STEPS.length) return null;
  return (
    <ButtonLink
      href={`${qualifyHref}?${recordQueryKey}=${recordId}&step=${next}`}
      variant="ghost"
    >
      Continue
      <ArrowRight className="h-4 w-4" />
    </ButtonLink>
  );
}

export function QualifyStepActions({
  qualifyHref,
  recordId,
  currentStep,
  maxStep,
  dirty,
  recordQueryKey = "oq",
  saveLabel = "Save & continue",
  saveIcon: SaveIcon,
}: {
  qualifyHref: string;
  recordId: string | null;
  currentStep: number;
  maxStep: number;
  dirty: boolean;
  recordQueryKey?: string;
  saveLabel?: string;
  saveIcon: LucideIcon;
}) {
  const canContinue =
    recordId !== null && currentStep < maxStep && !dirty;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {canContinue ? (
        <QualifyContinueLink
          qualifyHref={qualifyHref}
          recordId={recordId!}
          currentStep={currentStep}
          maxStep={maxStep}
          recordQueryKey={recordQueryKey}
        />
      ) : (
        <QualifySubmit label={saveLabel} icon={SaveIcon} />
      )}
    </div>
  );
}

export function QualifyStepPreviousLink({
  qualifyHref,
  recordId,
  step,
  recordQueryKey = "oq",
}: {
  qualifyHref: string;
  recordId: string;
  step: number;
  recordQueryKey?: string;
}) {
  const prev = step - 1;
  return (
    <ButtonLink
      href={`${qualifyHref}?${recordQueryKey}=${recordId}&step=${prev}`}
      variant="ghost"
      size="sm"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to {QUALIFY_STEPS[prev - 1]}
    </ButtonLink>
  );
}

export function RangePreviewBox({ summary }: { summary: string }) {
  return (
    <div className="rounded-[10px] border border-sapphire/20 bg-sapphire/5 p-3">
      <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-sapphire">
        Range of qualification preview
      </p>
      <p className="mt-1 text-[13.5px] text-charcoal">{summary}</p>
    </div>
  );
}

export function QualifyHiddenIds({
  operatorId,
  oqId,
}: {
  operatorId: string;
  oqId?: string | null;
}) {
  return (
    <>
      <input type="hidden" name="_operator_id" value={operatorId} />
      {oqId ? <input type="hidden" name="_oq_id" value={oqId} /> : null}
    </>
  );
}

export const GROUP_SESSION_STEPS = [
  "Participants",
  "Plan",
  "Test piece",
  "NDT / DT",
  "Certificate",
] as const;

export function GroupSessionStepper({
  step,
  maxStep,
  baseHref,
}: {
  step: number;
  maxStep: number;
  baseHref: string;
}) {
  const labels = GROUP_SESSION_STEPS.slice(1);

  return (
    <div className="mb-8 flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n <= maxStep && n !== step;
        const reachable = n <= maxStep && n !== step;
        const content = (
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full font-display text-[13px] font-semibold",
                active && "bg-inverse-bg text-inverse-fg",
                done && "step-done",
                !active && !done && "bg-onyx/5 text-steel",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span
              className={cn(
                "text-[14px] font-medium",
                active ? "text-onyx" : "text-graphite",
              )}
            >
              {label}
            </span>
          </div>
        );
        return (
          <div key={label} className="flex items-center gap-2">
            {reachable && !active ? (
              <Link
                href={`${baseHref}?step=${n}`}
                className="rounded-[10px] transition-colors hover:bg-frost/80"
              >
                {content}
              </Link>
            ) : (
              content
            )}
            {i < labels.length - 1 && (
              <span className="mx-1 h-px w-6 bg-silver" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GroupStepPreviousLink({
  baseHref,
  step,
}: {
  baseHref: string;
  step: number;
}) {
  const prev = step - 1;
  if (prev < 1) return null;
  return (
    <ButtonLink href={`${baseHref}?step=${prev}`} variant="ghost" size="sm">
      <ArrowLeft className="h-4 w-4" />
      Back to {GROUP_SESSION_STEPS[prev]}
    </ButtonLink>
  );
}
