import { cn } from "@/lib/utils";

/** Horizontal scroll container for wide data tables on narrow viewports. */
export function TableScrollArea({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "table-scroll-area min-w-0 max-w-full overflow-x-auto rounded-[var(--radius-card)] border border-silver bg-panel [-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      {children}
    </div>
  );
}
