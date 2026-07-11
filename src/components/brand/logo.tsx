import Image from "next/image";
import { cn } from "@/lib/utils";

const BRAND = {
  icon: {
    light: "/brand/icon-light.png",
    dark: "/brand/icon-dark.png",
  },
  stacked: {
    light: "/brand/logo-stacked-light.png",
    dark: "/brand/logo-stacked-dark.png",
  },
} as const;

function BrandWordmark({ onDark }: { onDark: boolean }) {
  const wordColor = onDark ? "text-white" : "text-midnight";
  return (
    <span className="font-display text-[20px] font-bold tracking-tight">
      <span className={wordColor}>Weld</span>
      <span className="text-ember">.</span>
      <span className={wordColor}>Doc</span>
    </span>
  );
}

export function Logo({
  className,
  variant = "horizontal",
  showText = true,
  onDark = false,
}: {
  className?: string;
  /** Stacked image, or icon with optional wordmark beside it. */
  variant?: "horizontal" | "stacked";
  /** Horizontal only — false shows the icon alone. */
  showText?: boolean;
  onDark?: boolean;
}) {
  const theme = onDark ? "dark" : "light";

  if (variant === "stacked") {
    return (
      <Image
        src={BRAND.stacked[theme]}
        alt="Weld.Doc"
        width={611}
        height={564}
        className={cn("h-10 w-auto", className)}
        priority
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={BRAND.icon[theme]}
        alt=""
        width={355}
        height={417}
        aria-hidden
        className="h-9 w-auto shrink-0"
        priority
      />
      {showText ? <BrandWordmark onDark={onDark} /> : null}
    </span>
  );
}
