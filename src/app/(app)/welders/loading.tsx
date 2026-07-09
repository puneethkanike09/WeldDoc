import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons";

export default function WeldersLoading() {
  return (
    <div role="status" aria-label="Loading welders">
      <PageHeaderSkeleton />
      <div className="page-content">
        <FilterBarSkeleton selects={2} />
        <div className="mt-5">
          <TableSkeleton columns={6} rows={8} />
        </div>
      </div>
      <span className="sr-only">Loading welders…</span>
    </div>
  );
}
