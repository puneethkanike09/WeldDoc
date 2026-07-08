import type { QualificationRecord } from "@/types/db";

export type SupplementaryFilletEntry = {
  process: string;
  position: string;
  thickness_mm: number | null;
};

export function hasAnySupplementaryFillet(
  q: Pick<
    QualificationRecord,
    "supplementary_fillet" | "supplementary_fillet_2" | "joint_type"
  >,
): boolean {
  if (q.joint_type === "FW") return false;
  return Boolean(q.supplementary_fillet || q.supplementary_fillet_2);
}

/** Ordered supplementary fillet tests (one per process when multi-process). */
export function listSupplementaryFilletEntries(
  wpq: QualificationRecord,
): SupplementaryFilletEntry[] {
  const entries: SupplementaryFilletEntry[] = [];

  if (wpq.supplementary_fillet) {
    entries.push({
      process: wpq.supplementary_fillet_process ?? wpq.process,
      position: wpq.supplementary_fillet_position ?? "PB",
      thickness_mm: wpq.supplementary_fillet_thickness_mm,
    });
  }

  if (wpq.supplementary_fillet_2 && wpq.process_2) {
    entries.push({
      process: wpq.process_2,
      position: wpq.supplementary_fillet_2_position ?? "PB",
      thickness_mm: wpq.supplementary_fillet_2_thickness_mm,
    });
  }

  return entries;
}
