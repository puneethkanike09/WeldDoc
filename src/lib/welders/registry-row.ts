import type { WelderSummary } from "@/lib/welder-status";

export interface WelderRow {
  id: string;
  welder_id: string;
  full_name: string;
  photoUrl: string | null;
  summary: WelderSummary;
}
