import type { OperatorSummary } from "@/lib/operator-status";

export interface OperatorRow {
  id: string;
  operator_id: string;
  full_name: string;
  photoUrl: string | null;
  summary: OperatorSummary;
}
