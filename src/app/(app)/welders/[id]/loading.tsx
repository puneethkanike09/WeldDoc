import {
  BackLinkSkeleton,
  QualificationPanelSkeleton,
  Skeleton,
} from "@/components/app/skeletons";

export default function WelderProfileLoading() {
  return (
    <div role="status" aria-label="Loading welder profile">
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

      <div className="page-content">
        <BackLinkSkeleton />

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
      </div>

      <div className="px-8 pb-8">
        <QualificationPanelSkeleton />
      </div>

      <span className="sr-only">Loading welder profile…</span>
    </div>
  );
}
