import {
  PageHeaderSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons";

export default function OperatorsLoading() {
  return (
    <div role="status" aria-label="Loading operators">
      <PageHeaderSkeleton />
      <div className="px-8 py-8">
        <FilterBarSkeleton selects={2} />
        <div className="mt-5">
          <TableSkeleton columns={6} rows={8} />
        </div>
      </div>
      <span className="sr-only">Loading operators…</span>
    </div>
  );
}
