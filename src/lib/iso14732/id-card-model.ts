import type { OperatorQualification } from "@/types/db";
import { processLabel } from "@/lib/iso14732/constants";
import { isActiveQualification } from "@/lib/qualification-active";
import { formatDate } from "@/lib/utils";

export interface OperatorIdCardQualRow {
  process: string;
  weldingEquipmentType: string;
  jointType: string;
  testDate: string;
  validUpto: string;
}

export function buildOperatorIdCardRows(
  oqs: OperatorQualification[],
): OperatorIdCardQualRow[] {
  return oqs
    .filter((q) => isActiveQualification(q))
    .filter((q) => q.oq_status === "Approved")
    .map((q) => ({
      process: processLabel(q.process),
      weldingEquipmentType: q.welding_mode ?? "—",
      jointType: q.joint_type ?? "—",
      testDate: formatDate(q.certificate_issued_date ?? q.date_of_welding),
      validUpto: formatDate(q.expiry_date),
    }));
}
