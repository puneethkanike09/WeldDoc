import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { OperatorMasterTable } from "@/components/masterlist/operator-master-table";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireOperatorWorkspace } from "@/lib/standards/active-standard.server";
import { getOperatorMasterListRows } from "@/lib/operator-masterlist";

export const metadata: Metadata = { title: "Operator master list" };

export default async function OperatorMasterListPage() {
  await requireOperatorWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();
  const rows = await getOperatorMasterListRows(supabase, org.id);

  return (
    <>
      <PageHeader
        title="Master list"
        description="Every operator qualification with its computed range of qualification. Export to Excel."
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center text-graphite">
            No qualification records yet. Qualify an operator to populate the
            master list.
          </div>
        ) : (
          <OperatorMasterTable rows={rows} />
        )}
      </div>
    </>
  );
}
