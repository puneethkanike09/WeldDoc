import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { WelderMasterTable } from "@/components/masterlist/welder-master-table";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
import { getMasterListRows } from "@/lib/masterlist";

export const metadata: Metadata = { title: "Welder master list" };

export default async function WelderMasterListPage() {
  await requireWelderWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();
  const rows = await getMasterListRows(supabase, org.id);

  return (
    <>
      <PageHeader
        title="Master list"
        description="Every welder qualification with its computed range of approval. Export to Excel."
      />
      <div className="px-8 py-8">
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center text-graphite">
            No qualification records yet. Qualify a welder to populate the
            master list.
          </div>
        ) : (
          <WelderMasterTable rows={rows} />
        )}
      </div>
    </>
  );
}
