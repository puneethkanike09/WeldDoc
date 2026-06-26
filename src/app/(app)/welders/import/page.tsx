import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { BulkImportPanel } from "@/components/welders/bulk-import-panel";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { commitWelderImport } from "./actions";

export const metadata: Metadata = { title: "Import welders" };
export const dynamic = "force-dynamic";

export default async function WelderImportPage() {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("welders")
    .select("welder_id")
    .eq("org_id", org.id);

  const existingPlantIds = (existing ?? [])
    .map((w) => normalizePlantWelderId(w.welder_id))
    .filter((id): id is string => Boolean(id));

  return (
    <>
      <PageHeader
        title="Import welders"
        description="Bulk import welders and prior qualifications from Excel."
      />
      <div className="px-8 py-8">
        <BulkImportPanel
          commitAction={commitWelderImport}
          existingPlantIds={existingPlantIds}
        />
      </div>
    </>
  );
}
