import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "ember" | "subtle";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 cursor-pointer font-display font-medium tracking-tight transition-all duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-onyx/40 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

const variants: Record<Variant, string> = {
  primary:
    "bg-onyx text-white shadow-[var(--shadow-subtle)] hover:bg-charcoal active:translate-y-px",
  ghost:
    "bg-white text-onyx border border-onyx hover:bg-frost active:translate-y-px",
  ember:
    "bg-ember text-white hover:bg-[#8f2600] shadow-[var(--shadow-subtle)] active:translate-y-px",
  subtle: "bg-transparent text-charcoal hover:bg-onyx/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[10px]",
  md: "h-11 px-5 text-[15px] rounded-[var(--radius-button)]",
  lg: "h-13 px-7 text-base rounded-[var(--radius-button)] py-3.5",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
