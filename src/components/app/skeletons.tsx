import { cn } from "@/lib/utils";

/** Base shimmer block. Compose these into page-shaped skeletons. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[10px] bg-onyx/5", className)}
      aria-hidden
    />
  );
}

/** Matches <PageHeader>: title + description on the left, optional action on the right. */
export function PageHeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 border-b border-silver bg-panel/60 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-36 shrink-0" />}
    </div>
  );
}

/** A filter bar: search input + a couple of selects. */
export function FilterBarSkeleton({ selects = 2 }: { selects?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Skeleton className="h-10 flex-1" />
      {Array.from({ length: selects }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full sm:w-44" />
      ))}
    </div>
  );
}

/** A bordered table card with a header row and body rows. */
export function TableSkeleton({
  columns = 6,
  rows = 8,
  minWidth,
}: {
  columns?: number;
  rows?: number;
  minWidth?: number;
}) {
  return (
    <div className="overflow-hidden rounded-(--radius-card) border border-silver bg-panel">
      <div style={minWidth ? { minWidth } : undefined}>
        <div className="flex gap-4 border-b border-silver bg-frost px-5 py-3.5">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            className="flex items-center gap-4 border-b border-silver/60 px-5 py-4 last:border-0"
          >
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton
                key={c}
                className={cn("h-4 flex-1", c === 0 && "max-w-[180px]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A bordered content card with a configurable body height. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) border border-silver bg-panel p-6",
        className,
      )}
    />
  );
}
