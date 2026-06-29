"use client";

import { FileText } from "lucide-react";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";

/** View uploaded NDT report in the side PDF drawer. */
export function NdtReportViewer({
  reportSrc,
  welderId,
  operatorId,
  recordId,
  testMethod,
}: {
  reportSrc?: string;
  welderId?: string;
  operatorId?: string;
  recordId?: string;
  testMethod: string;
}) {
  const { open } = useStandardPdfDrawer();
  const src =
    reportSrc ??
    (operatorId && recordId
      ? `/api/operators/${operatorId}/ndt/${recordId}/report`
      : welderId && recordId
        ? `/api/welders/${welderId}/ndt/${recordId}/report`
        : null);

  if (!src) return null;

  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-steel hover:bg-frost hover:text-onyx"
      onClick={() =>
        open({
          src,
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
