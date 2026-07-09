import { PageHeaderSkeleton, CardSkeleton } from "@/components/app/skeletons";

export default function AppLoading() {
  return (
    <div role="status" aria-label="Loading">
      <PageHeaderSkeleton />
      <div className="page-content space-y-6">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-64" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
