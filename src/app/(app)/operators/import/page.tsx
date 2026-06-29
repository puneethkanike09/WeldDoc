import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { OperatorBulkImportPanel } from "@/components/operators/bulk-import-panel";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { normalizePlantOperatorId } from "@/lib/operators/plant-id";

export const metadata: Metadata = { title: "Import operators" };
export const dynamic = "force-dynamic";

export default async function OperatorImportPage() {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("operators")
    .select("operator_id")
    .eq("org_id", org.id);

  const existingPlantIds = (existing ?? [])
    .map((o) => normalizePlantOperatorId(o.operator_id))
    .filter((id): id is string => Boolean(id));

  return (
    <>
      <PageHeader
        title="Import operators"
        description="Bulk import operators and prior qualifications from Excel."
      />
      <div className="px-8 py-8">
        <OperatorBulkImportPanel existingPlantIds={existingPlantIds} />
      </div>
    </>
  );
}
