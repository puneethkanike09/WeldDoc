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
    <div className="sticky top-0 z-20 flex flex-col gap-4 border-b border-silver bg-panel px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
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

/** Qualification master list row on welder / operator profile. */
export function QualListItemSkeleton({ active }: { active?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border px-3 py-2.5",
        active ? "border-inverse-bg bg-panel" : "border-silver bg-panel",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-3 w-[70%]" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

/** Right-hand qualification detail column only. */
export function QualificationDetailSkeleton() {
  return (
    <div
      className="min-h-112 space-y-5 rounded-(--radius-card) border border-silver bg-panel p-6"
      role="status"
      aria-label="Loading qualification details"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="ml-auto h-3 w-12" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-[10px]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-14 w-full rounded-[10px]" />
          </div>
          <Skeleton className="h-11 w-full rounded-[10px]" />
        </div>
        <Skeleton className="h-36 w-full rounded-[10px] xl:self-start" />
      </div>
      <span className="sr-only">Loading qualification details…</span>
    </div>
  );
}

/** Profile qualifications panel — sidebar list + detail column. */
export function QualificationPanelSkeleton({
  listItems = 5,
}: {
  listItems?: number;
}) {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[300px_1fr]"
      role="status"
      aria-label="Loading qualifications"
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: listItems }, (_, i) => (
            <QualListItemSkeleton key={i} active={i === 0} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-silver pt-3">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>

      <QualificationDetailSkeleton />
      <span className="sr-only">Loading qualifications…</span>
    </div>
  );
}

export function BackLinkSkeleton() {
  return <Skeleton className="mb-6 h-4 w-32" />;
}

/** Bulk Excel import page — upload card only (preview table appears after validation). */
export function BulkImportPageSkeleton() {
  return (
    <div role="status" aria-label="Loading import page">
      <PageHeaderSkeleton action={false} />
      <div className="px-8 py-8">
        <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="mt-1 h-4 w-full max-w-3xl" />
              <Skeleton className="h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-[80%] max-w-xl" />
            </div>

            <Skeleton className="h-9 w-40" />

            <div className="space-y-4">
              <div>
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-10 w-full max-w-lg" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading import page…</span>
    </div>
  );
}

/** Edit / add welder form page. */
export function WelderFormPageSkeleton() {
  return (
    <div role="status" aria-label="Loading welder form">
      <PageHeaderSkeleton />
      <div className="px-8 py-8">
        <BackLinkSkeleton />
        <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
          <Skeleton className="h-5 w-36" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className={cn("space-y-2", i === 2 && "sm:col-span-2")}
              >
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading welder form…</span>
    </div>
  );
}

/** Certificate, ID card, signed certificate preview pages. */
export function PdfPreviewPageSkeleton() {
  return (
    <div role="status" aria-label="Loading document preview">
      <PageHeaderSkeleton />
      <div className="flex min-h-112 flex-col gap-4 px-8 py-8">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-36" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <Skeleton className="min-h-112 w-full flex-1 rounded-button" />
      </div>
      <span className="sr-only">Loading document…</span>
    </div>
  );
}

/** Qualification workflow (stepper + form card). */
export function QualifyWorkflowSkeleton() {
  return (
    <div role="status" aria-label="Loading qualification workflow">
      <PageHeaderSkeleton action={false} />
      <div className="px-8 py-8">
        <BackLinkSkeleton />
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
              {i < 3 && <Skeleton className="mx-1 h-px w-6" />}
            </div>
          ))}
        </div>
        <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading workflow…</span>
    </div>
  );
}


function StandardCardSkeleton() {
  return (
    <article className="flex h-full flex-col rounded-(--radius-card) border border-silver bg-panel p-6 sm:p-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-9 w-56 max-w-full" />
      <Skeleton className="mt-2 h-4 w-48 max-w-full" />
      <div className="mt-5 flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-silver pt-5">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 shrink-0 rounded-[10px]" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-[10px]" />
        </div>
        <Skeleton className="h-7 w-36 shrink-0 rounded-full" />
      </div>
    </article>
  );
}

/** Standards hub — 2×2 catalog cards. */
export function StandardsHubSkeleton() {
  return (
    <div role="status" aria-label="Loading standards">
      <PageHeaderSkeleton action={false} />
      <div className="grid gap-5 px-8 py-8 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <StandardCardSkeleton key={i} />
        ))}
      </div>
      <span className="sr-only">Loading standards…</span>
    </div>
  );
}
