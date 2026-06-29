import type { OperatorSummary } from "@/lib/operator-status";

export interface OperatorRow {
  id: string;
  uid: string;
  operator_id: string | null;
  full_name: string;
  photoUrl: string | null;
  summary: OperatorSummary;
}
