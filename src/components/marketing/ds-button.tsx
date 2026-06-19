import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center transition-opacity duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-blue";

type Variant = "primary" | "primary-on-dark" | "secondary" | "secondary-on-dark";

export function DsButtonLink({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}

const variants: Record<Variant, string> = {
  primary:
    "rounded-pill bg-primary px-6 py-3 text-button text-white hover:opacity-90 min-h-[44px]",
  "primary-on-dark":
    "rounded-pill bg-canvas px-6 py-3 text-button text-ink hover:opacity-90 min-h-[44px]",
  secondary:
    "text-body text-ink underline underline-offset-4 hover:opacity-70 p-0 min-h-0",
  "secondary-on-dark":
    "text-body text-white underline underline-offset-4 hover:opacity-70 p-0 min-h-0",
};
