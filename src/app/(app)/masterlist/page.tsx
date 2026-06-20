import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { getMasterListRows } from "@/lib/masterlist";
import { MasterTable } from "./master-table";

export const metadata: Metadata = { title: "Master list" };

export default async function MasterListPage() {
  const { org } = await requireSession();
  const supabase = await createClient();
  const rows = await getMasterListRows(supabase, org.id);

  return (
    <>
      <PageHeader
        title="Master list"
        description="Every welder qualification with its computed range of approval. Export to Excel or PDF, including the PED master list format."
      />
      <div className="px-8 py-8">
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center text-graphite">
            No qualification records yet. Qualify a welder to populate the
            master list.
          </div>
        ) : (
          <MasterTable rows={rows} />
        )}
      </div>
    </>
  );
}
