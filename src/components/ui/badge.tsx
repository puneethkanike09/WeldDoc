import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "neutral"
  | "active"
  | "expiring"
  | "expired"
  | "ember"
  | "sapphire"
  | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-onyx/5 text-charcoal",
  active: "bg-active/15 text-active-ink",
  expiring: "bg-expiring/20 text-expiring-ink",
  expired: "bg-expired/15 text-expired-ink",
  ember: "bg-ember/10 text-ember",
  sapphire: "bg-sapphire/10 text-sapphire",
  outline: "border border-silver text-graphite bg-panel",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-tag)] px-2.5 py-1 text-xs font-medium font-display tracking-tight",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
