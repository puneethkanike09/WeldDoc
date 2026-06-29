import type { SupabaseClient } from "@supabase/supabase-js";
import { buildIdCardPayload } from "@/lib/iso9606/id-card-model";
import { buildOperatorIdCardRows } from "@/lib/iso14732/id-card-model";
import { summarizeWelder } from "@/lib/welder-status";
import { summarizeOperator } from "@/lib/operator-status";
import {
  normalizePlantOperatorId,
  plantOperatorIdFromUid,
} from "@/lib/operators/plant-id";
import { formatDate } from "@/lib/utils";
import type {
  Operator,
  OperatorQualification,
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import type { WelderIdCardViewProps } from "@/components/verify/welder-id-card-view";

function publicStorageUrl(bucket: string, path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function loadWelderIdCardView(
  supabase: SupabaseClient,
  welder: Welder,
): Promise<WelderIdCardViewProps & { orgName: string }> {
  const [{ data: org }, { data: wpqRows }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", welder.org_id).single(),
    supabase
      .from("qualification_records")
      .select("*")
      .eq("welder_id", welder.id),
  ]);

  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const wpqIds = wpqs.map((q) => q.id);
  const { data: rangeRows } = await supabase
    .from("ranges_of_approval")
    .select("*")
    .in(
      "wpq_id",
      wpqIds.length ? wpqIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );

  const card = buildIdCardPayload(welder, wpqs, ranges);
  const summary = summarizeWelder(welder, wpqs);
  const orgRow = org as Organization | null;

  return {
    orgName: orgRow?.name ?? "WeldDoc",
    welderName: card.welderName,
    welderNo: card.welderNo,
    uid: welder.uid,
    photoUrl: publicStorageUrl("welder-photos", welder.photo_path),
    logoUrl: publicStorageUrl("org-assets", orgRow?.logo_path ?? null),
    rows: card.rows,
    status: summary.overall,
    expiry: summary.nearestExpiry ? formatDate(summary.nearestExpiry) : null,
    employer: welder.employer,
    site: welder.branch_location ?? orgRow?.location_code ?? "—",
    cardHeading: "Welder ID card",
    plantIdLabel: "Welder ID",
    standardLabel: "EN ISO 9606-1:2017",
  };
}

export async function loadOperatorIdCardView(
  supabase: SupabaseClient,
  operator: Operator,
): Promise<WelderIdCardViewProps & { orgName: string }> {
  const [{ data: org }, { data: oqRows }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", operator.org_id).single(),
    supabase
      .from("operator_qualifications")
      .select("*")
      .eq("operator_id", operator.id),
  ]);

  const oqs = (oqRows ?? []) as OperatorQualification[];
  const summary = summarizeOperator(operator, oqs);
  const orgRow = org as Organization | null;
  const plantId =
    normalizePlantOperatorId(operator.operator_id) ??
    operator.operator_id?.trim() ??
    plantOperatorIdFromUid(operator.uid) ??
    operator.uid;

  return {
    orgName: orgRow?.name ?? "WeldDoc",
    welderName: operator.full_name,
    welderNo: plantId,
    uid: operator.uid,
    photoUrl: publicStorageUrl("welder-photos", operator.photo_path),
    logoUrl: publicStorageUrl("org-assets", orgRow?.logo_path ?? null),
    rows: buildOperatorIdCardRows(oqs),
    status: summary.overall,
    expiry: summary.nearestExpiry ? formatDate(summary.nearestExpiry) : null,
    employer: operator.employer,
    site: operator.branch_location ?? orgRow?.location_code ?? "—",
    cardHeading: "Operator ID card",
    plantIdLabel: "Operator ID",
    standardLabel: "ISO 14732:2025",
  };
}
