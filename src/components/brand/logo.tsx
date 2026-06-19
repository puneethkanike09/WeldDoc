import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  onDark = false,
}: {
  className?: string;
  showText?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative grid h-8 w-8 place-items-center rounded-[9px]",
          onDark ? "bg-white/10" : "bg-onyx",
        )}
      >
        {/* Stylised weld arc / bead mark */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 12.5c2-0.4 3-2.6 4.2-4.5C7.7 5.6 9 3 11 3c2.5 0 3 5 5 6.2"
            stroke="#fcab79"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="14.3" cy="11.6" r="2.1" fill="#aa2d00" />
          <circle cx="14.3" cy="11.6" r="3.4" stroke="#aa2d00" strokeWidth="0.9" opacity="0.4" />
        </svg>
      </span>
      {showText && (
        <span
          className={cn(
            "font-display text-[20px] font-bold tracking-tight",
            onDark ? "text-white" : "text-onyx",
          )}
        >
          Weld<span className={onDark ? "text-primary-on-dark" : "text-ember"}>Doc</span>
        </span>
      )}
    </span>
  );
}
