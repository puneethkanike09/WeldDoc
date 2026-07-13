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
        description="Upload a spreadsheet to add welders and certificates. Only your organisation can see this data."
      />
      <div className="page-content">
        <BulkImportPanel commitAction={commitWelderImport} />
      </div>
    </>
  );
}
