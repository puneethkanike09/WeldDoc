import Link from "next/link";
import { cn } from "@/lib/utils";

export const LEGAL_PATHS = ["/privacy", "/terms", "/security"] as const;

export type LegalPath = (typeof LEGAL_PATHS)[number];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/security", label: "Security" },
] as const;

export function isLegalPath(pathname: string): pathname is LegalPath {
  return (LEGAL_PATHS as readonly string[]).includes(pathname);
}

export function LegalNavLinks({
  active,
  variant = "default",
  className,
}: {
  active?: (typeof LEGAL_LINKS)[number]["href"];
  variant?: "default" | "on-dark";
  className?: string;
}) {
  const isActive = (href: (typeof LEGAL_LINKS)[number]["href"]) =>
    active === href;

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}
      aria-label="Legal"
    >
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-caption",
            variant === "on-dark"
              ? cn(
                  "text-white/70 transition-colors hover:text-white",
                  isActive(link.href) && "font-medium text-white",
                )
              : cn(
                  "text-muted-slate transition-opacity hover:opacity-70",
                  isActive(link.href) && "font-medium text-ink",
                ),
          )}
          aria-current={isActive(link.href) ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export { LEGAL_LINKS };
