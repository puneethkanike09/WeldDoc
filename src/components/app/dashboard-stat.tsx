import Link from "next/link";
import { cn } from "@/lib/utils";

export type StatTone = "brand" | "active" | "warning" | "danger";

export const statTones: Record<
  StatTone,
  { shell: string; label: string; value: string; hint: string; action: string }
> = {
  brand: {
    shell: "bg-inverse-bg border-inverse-bg",
    label: "text-inverse-fg/50",
    value: "text-inverse-fg",
    hint: "text-inverse-fg/40",
    action: "text-inverse-fg/70 hover:text-inverse-fg",
  },
  active: {
    shell: "bg-active border-active",
    label: "text-white/50",
    value: "text-white",
    hint: "text-white/40",
    action: "text-white/70 hover:text-white",
  },
  warning: {
    shell: "bg-expiring border-expiring",
    label: "text-warning-ink/55",
    value: "text-warning-ink",
    hint: "text-warning-ink/45",
    action: "text-warning-ink/70 hover:text-warning-ink",
  },
  danger: {
    shell: "bg-expired border-expired",
    label: "text-white/50",
    value: "text-white",
    hint: "text-white/40",
    action: "text-white/70 hover:text-white",
  },
};

export function DashboardStat({
  label,
  value,
  hint,
  tone = "active",
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: StatTone;
  href?: string;
}) {
  const t = statTones[tone];
  const inner = (
    <>
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.1em]",
          t.label,
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-display text-[42px] font-bold leading-none tracking-tight tabular-nums",
          t.value,
        )}
      >
        {value}
      </p>
      {hint && (
        <p className={cn("mt-2.5 text-[13px] leading-snug", t.hint)}>{hint}</p>
      )}
    </>
  );

  const className = cn(
    "rounded-(--radius-card) border p-5 transition-opacity",
    t.shell,
    href && "hover:opacity-90",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
