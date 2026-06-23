import { PageHeaderSkeleton, Skeleton } from "@/components/app/skeletons";

export default function ReportsLoading() {
  return (
    <div role="status" aria-label="Loading test reports">
      <PageHeaderSkeleton />
      <div className="px-8 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="rounded-(--radius-card) border border-silver bg-panel p-5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-5 w-24" />
              <Skeleton className="mt-2 h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading test reports…</span>
    </div>
  );
}
