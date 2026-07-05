import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { BulkImportPanel } from "@/components/welders/bulk-import-panel";
import { commitWelderImport } from "./actions";

export const metadata: Metadata = { title: "Import welders" };
export const dynamic = "force-dynamic";

export default async function WelderImportPage() {
  return (
    <>
      <PageHeader
        title="Import welders"
        description="Bulk import welders and prior qualifications from Excel. Data is scoped to your organisation only."
      />
      <div className="px-8 py-8">
        <BulkImportPanel commitAction={commitWelderImport} />
      </div>
    </>
  );
}
