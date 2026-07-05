import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { OperatorBulkImportPanel } from "@/components/operators/bulk-import-panel";

export const metadata: Metadata = { title: "Import operators" };
export const dynamic = "force-dynamic";

export default async function OperatorImportPage() {
  return (
    <>
      <PageHeader
        title="Import operators"
        description="Bulk import operators and prior qualifications from Excel."
      />
      <div className="px-8 py-8">
        <OperatorBulkImportPanel />
      </div>
    </>
  );
}
