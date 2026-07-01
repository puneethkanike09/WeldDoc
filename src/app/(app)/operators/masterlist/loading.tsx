import {
  PageHeaderSkeleton,
  Skeleton,
  TableSkeleton,
} from "@/components/app/skeletons";

export default function OperatorMasterListLoading() {
  return (
    <div role="status" aria-label="Loading master list">
      <PageHeaderSkeleton action={false} />
      <div className="px-8 py-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <Skeleton className="h-10 w-full lg:w-40" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="sleek-scroll mt-5 overflow-x-auto">
          <TableSkeleton columns={8} rows={10} minWidth={1200} />
        </div>
      </div>
      <span className="sr-only">Loading master list…</span>
    </div>
  );
}
