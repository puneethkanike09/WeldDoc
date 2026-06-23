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
      <div className="space-y-8 px-8 py-8">
        <FormCardSkeleton fields={4} />
        <FormCardSkeleton fields={3} />
      </div>
      <span className="sr-only">Loading settings…</span>
    </div>
  );
}
