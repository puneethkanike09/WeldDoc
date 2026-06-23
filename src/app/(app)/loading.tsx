import { PageHeaderSkeleton, CardSkeleton } from "@/components/app/skeletons";

export default function AppLoading() {
  return (
    <div role="status" aria-label="Loading">
      <PageHeaderSkeleton />
      <div className="space-y-6 px-8 py-8">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-64" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
