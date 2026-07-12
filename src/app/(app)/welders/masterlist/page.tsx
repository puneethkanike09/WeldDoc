import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { WelderMasterTable } from "@/components/masterlist/welder-master-table";
import { CustomizeMasterListColumnsButton } from "@/components/masterlist/customize-masterlist-columns";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
import {
  getMasterListRows,
  welderMasterListColumnDefs,
  orderedWelderMasterListColumns,
} from "@/lib/masterlist";
import {
  ALL_WELDER_MASTER_EXPORT_KEYS,
  WELDER_MASTER_LIST_COLUMN_CATALOG,
} from "@/lib/masterlist/columns";
import {
  filterWelderMasterRows,
  parseWelderMasterListFilters,
} from "@/lib/masterlist/filter-rows";
import {
  parseRegistryListPage,
  registryListRange,
} from "@/lib/registry/list-pagination";
import { updateWelderMasterListColumns } from "@/app/(app)/welders/masterlist/actions";

export const metadata: Metadata = { title: "Welder master list" };

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  joint?: string;
};

export default async function WelderMasterListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireWelderWorkspace();
  const sp = await searchParams;
  const filters = parseWelderMasterListFilters(sp);
  const requestedPage = parseRegistryListPage(sp.page);

  const { org } = await requireSession();
  const supabase = await createClient();
  const allRows = await getMasterListRows(supabase, org.id);
  const columnOrder = orderedWelderMasterListColumns(org.masterlist_columns);
  const columns = welderMasterListColumnDefs(org.masterlist_columns);

  const filtered = filterWelderMasterRows(allRows, filters);
  const { safePage, from, to } = registryListRange(
    requestedPage,
    filtered.length,
  );
  const pageRows = filtered.slice(from, to);

  return (
    <>
      <PageHeader
        title="Master list"
        description="Every welder qualification with its computed range of approval. Export to Excel."
      >
        <CustomizeMasterListColumnsButton
          action={updateWelderMasterListColumns}
          initialColumns={columnOrder}
          catalog={WELDER_MASTER_LIST_COLUMN_CATALOG}
          allKeys={ALL_WELDER_MASTER_EXPORT_KEYS}
          scopeLabel="welder master list"
        />
      </PageHeader>
      <div className="page-content">
        {allRows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center text-graphite">
            No qualification records yet. Qualify a welder to populate the
            master list.
          </div>
        ) : (
          <WelderMasterTable
            rows={pageRows}
            exportRows={filtered}
            columns={columns}
            page={safePage}
            rowOffset={from}
            filteredCount={filtered.length}
            totalCount={allRows.length}
            q={filters.q ?? ""}
            status={filters.status ?? "all"}
            joint={filters.joint ?? "all"}
          />
        )}
      </div>
    </>
  );
}
