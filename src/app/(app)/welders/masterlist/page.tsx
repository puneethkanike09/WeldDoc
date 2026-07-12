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
import { updateWelderMasterListColumns } from "@/app/(app)/welders/masterlist/actions";

export const metadata: Metadata = { title: "Welder master list" };

export default async function WelderMasterListPage() {
  await requireWelderWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();
  const rows = await getMasterListRows(supabase, org.id);
  const columnOrder = orderedWelderMasterListColumns(org.masterlist_columns);
  const columns = welderMasterListColumnDefs(org.masterlist_columns);

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
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center text-graphite">
            No qualification records yet. Qualify a welder to populate the
            master list.
          </div>
        ) : (
          <WelderMasterTable rows={rows} columns={columns} />
        )}
      </div>
    </>
  );
}
