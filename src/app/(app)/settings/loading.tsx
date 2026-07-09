import { PageHeaderSkeleton, Skeleton } from "@/components/app/skeletons";

function FormCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div role="status" aria-label="Loading settings">
      <PageHeaderSkeleton action={false} />
      <div className="page-content space-y-6">
        <div className="flex flex-wrap gap-1 rounded-button bg-frost p-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-36 rounded-[10px]" />
          ))}
        </div>
        <FormCardSkeleton fields={4} />
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
