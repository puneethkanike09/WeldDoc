import type { OperatorQualification } from "@/types/db";
import type { IdCardQualRow } from "@/lib/iso9606/id-card-model";
import { processLabel } from "@/lib/iso14732/constants";
import { isActiveQualification } from "@/lib/qualification-active";
import { formatDate } from "@/lib/utils";

export function buildOperatorIdCardRows(
  oqs: OperatorQualification[],
): IdCardQualRow[] {
  return oqs
    .filter((q) => isActiveQualification(q))
    .filter((q) => q.oq_status === "Approved")
    .map((q) => ({
      process: processLabel(q.process),
      positionBw: q.welding_mode ?? "—",
      positionFw: q.product_type ?? "—",
      thicknessBw: q.joint_type ?? "—",
      thicknessFw: q.welding_type ?? "—",
      od: "—",
      jointType: q.joint_type ?? "—",
      fmGroup: q.revalidation_method ?? "—",
      testDate: formatDate(q.certificate_issued_date ?? q.date_of_welding),
      validUpto: formatDate(q.expiry_date),
    }));
}
