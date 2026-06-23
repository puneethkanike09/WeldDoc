import { Skeleton } from "@/components/app/skeletons";
import { cn } from "@/lib/utils";

function QualListItemSkeleton({ active }: { active?: boolean }) {
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

export default function WelderProfileLoading() {
  return (
    <div role="status" aria-label="Loading welder profile">
      {/* Page header — name + Edit / ID card / QR */}
      <div className="flex flex-col gap-4 border-b border-silver bg-panel/60 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-18" />
          <Skeleton className="h-9 w-22" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>

      <div className="px-8 py-8">
        <Skeleton className="mb-6 h-4 w-32" />

        {/* Identity band */}
        <div className="mb-6 rounded-(--radius-card) border border-silver bg-panel p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-button" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:max-w-3xl">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full max-w-32" />
                </div>
              ))}
            </div>

            <div className="lg:w-52 lg:shrink-0">
              <Skeleton className="mb-2 h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Qualifications — master / detail */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-1.5">
              <QualListItemSkeleton active />
              <QualListItemSkeleton />
              <QualListItemSkeleton />
            </div>
          </div>

          <div className="min-h-112 space-y-5 rounded-(--radius-card) border border-silver bg-panel p-6">
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

            <Skeleton className="h-16 w-full rounded-[10px]" />

            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>

            <Skeleton className="h-11 w-full rounded-[10px]" />

            <div className="space-y-2 pt-1">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-14 w-full rounded-[10px]" />
              <Skeleton className="h-14 w-full rounded-[10px]" />
            </div>

            <Skeleton className="h-11 w-full rounded-[10px]" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading welder profile…</span>
    </div>
  );
}
