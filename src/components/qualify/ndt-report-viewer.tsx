"use client";

import { FileText } from "lucide-react";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";

/** View uploaded NDT report in the side PDF drawer. */
export function NdtReportViewer({
  welderId,
  recordId,
  testMethod,
}: {
  welderId: string;
  recordId: string;
  testMethod: string;
}) {
  const { open } = useStandardPdfDrawer();

  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-steel hover:bg-frost hover:text-onyx"
      onClick={() =>
        open({
          src: `/api/welders/${welderId}/ndt/${recordId}/report`,
          title: `${testMethod} — NDT report`,
          description: "Uploaded test report",
        })
      }
    >
      <FileText className="size-3.5" />
      View report
    </button>
  );
}
