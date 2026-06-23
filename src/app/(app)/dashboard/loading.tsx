import {
  PageHeaderSkeleton,
  CardSkeleton,
  Skeleton,
} from "@/components/app/skeletons";

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <PageHeaderSkeleton />
      <div className="space-y-6 px-8 py-8">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="rounded-(--radius-card) border border-silver bg-panel p-5"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-9 w-16" />
              <Skeleton className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Donut charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="rounded-(--radius-card) border border-silver bg-panel p-6"
            >
              <Skeleton className="h-4 w-32" />
              <div className="mt-6 flex justify-center">
                <Skeleton className="h-36 w-36 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Coverage table + needs-attention list */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <CardSkeleton className="h-72" />
          <CardSkeleton className="h-72" />
        </div>
      </div>
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
