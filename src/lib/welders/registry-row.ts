import type { WelderSummary } from "@/lib/welder-status";

export interface WelderRow {
  id: string;
  uid: string;
  welder_id: string | null;
  full_name: string;
  photoUrl: string | null;
  summary: WelderSummary;
}
