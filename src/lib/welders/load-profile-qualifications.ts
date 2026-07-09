import type { SupabaseClient } from "@supabase/supabase-js";
import type { QualListItem } from "@/components/qualify/qualification-sidebar";
import type { QualView } from "@/app/(app)/welders/[id]/welder-qualifications";
import { qualificationProcessLabel, POSITION_LABELS, ALL_NDT_TESTS, isMultiProcessQualification } from "@/lib/iso9606/constants";
import {
  parseQualListPage,
  qualListRange,
} from "@/lib/qualify/profile-pagination";
import { daysUntil } from "@/lib/welder-status";
import { isActiveQualification } from "@/lib/qualification-active";
import { continuityDue } from "@/lib/expiry";
import { resolveUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { findSessionForQualification } from "@/lib/qualify/group-session";
import { effectiveRangeForWpq } from "@/lib/iso9606/effective-range";
import type {
  QualificationRecord,
  RangeOfApproval,
  ValidationRecord,
  NdtDtRecord,
} from "@/types/db";

const WPQ_TONE: Record<
  string,
  "active" | "expiring" | "expired" | "neutral" | "sapphire"
> = {
  Approved: "active",
  Draft: "neutral",
  Pending_NDT: "sapphire",
  Failed: "expired",
  Expired: "expired",
  Superseded: "neutral",
};

function welderQualListItem(q: QualificationRecord): QualListItem {
  const position = q.position
    ? POSITION_LABELS[q.position] ?? q.position
    : "—";
  const inactive = !isActiveQualification(q);
  const continuityDueIso = q.continuity_last_verified
    ? continuityDue(q.continuity_last_verified)
    : null;
  return {
    id: q.id,
    title: `${qualificationProcessLabel(q.process, q.process_2)} · ${
      q.joint_type === "BW" ? "Butt" : "Fillet"
    } · ${q.product}`,
    subtitle: `ISO 9606-1 · Position ${position} · Method ${q.revalidation_method}`,
    isMultiProcess: isMultiProcessQualification(q),
    statusLabel: inactive ? "Inactive" : q.wpq_status.replace("_", " "),
    statusTone: inactive ? "neutral" : (WPQ_TONE[q.wpq_status] ?? "neutral"),
    expiry: formatDate(q.expiry_date),
    daysToExpiry: daysUntil(q.expiry_date),
    continuityDue: continuityDueIso ? formatDate(continuityDueIso) : null,
    daysToContinuityDue: continuityDueIso ? daysUntil(continuityDueIso) : null,
  };
}

function welderQualDetailView(
  q: QualificationRecord,
  ranges: Map<string, RangeOfApproval>,
  validationsByWpq: Map<string, ValidationRecord[]>,
  docUrlById: Map<string, string | null>,
  ndtViewsFor: (wpqId: string) => QualView["ndtRecords"],
): QualView {
  return {
    ...welderQualListItem(q),
    status: q.wpq_status,
    isActive: isActiveQualification(q),
    isLegacy: q.is_legacy,
    isApproved: q.wpq_status === "Approved",
    hasSignedCertificate: Boolean(q.signed_certificate_pdf_path),
    canLogValidation:
      isActiveQualification(q) &&
      (q.wpq_status === "Approved" || q.wpq_status === "Expired"),
    rangeSummary:
      effectiveRangeForWpq(q, ranges.get(q.id) ?? null).summary ?? null,
    ndtRecords: ndtViewsFor(q.id),
    validations: (validationsByWpq.get(q.id) ?? []).map((v) => ({
      id: v.id,
      kind: v.kind,
      validatedOn: formatDate(v.validated_on),
      validatorName: v.validator_name,
      note: v.note,
      newExpiry: v.new_expiry_date ? formatDate(v.new_expiry_date) : null,
      nextContinuityDue:
        v.kind === "continuity"
          ? formatDate(continuityDue(v.validated_on))
          : null,
      docUrl: docUrlById.get(v.id) ?? null,
    })),
  };
}

export async function loadWelderProfileQualifications(
  supabase: SupabaseClient,
  welderId: string,
  selectedWpqParam: string | undefined,
  pageParam: string | undefined,
) {
  const requestedPage = parseQualListPage(pageParam);

  const { data: allWpqRows } = await supabase
    .from("qualification_records")
    .select("id")
    .eq("welder_id", welderId);
  const allIds = (allWpqRows ?? []).map((r) => r.id);
  const totalCount = allIds.length;

  const { safePage, from, to } = qualListRange(requestedPage, totalCount);

  const { data: wpqRows } = await supabase
    .from("qualification_records")
    .select("*")
    .eq("welder_id", welderId)
    .order("created_at", { ascending: false })
    .range(from, to);
  const pageWpqs = (wpqRows ?? []) as QualificationRecord[];

  let selectedWpqId =
    selectedWpqParam && allIds.includes(selectedWpqParam)
      ? selectedWpqParam
      : (pageWpqs[0]?.id ?? allIds[0] ?? null);

  let selectedWpqRecord =
    pageWpqs.find((q) => q.id === selectedWpqId) ?? null;
  if (selectedWpqId && !selectedWpqRecord) {
    const { data: selectedRow } = await supabase
      .from("qualification_records")
      .select("*")
      .eq("id", selectedWpqId)
      .eq("welder_id", welderId)
      .single();
    selectedWpqRecord = (selectedRow as QualificationRecord | null) ?? null;
    if (!selectedWpqRecord) selectedWpqId = pageWpqs[0]?.id ?? null;
  }

  const relatedWpqIds = [
    ...new Set([
      ...pageWpqs.map((q) => q.id),
      ...(selectedWpqId ? [selectedWpqId] : []),
    ]),
  ];

  const emptyId = "00000000-0000-0000-0000-000000000000";
  const inIds = relatedWpqIds.length ? relatedWpqIds : [emptyId];

  const [{ data: rangeRows }, { data: validationRows }, { data: ndtRows }] =
    await Promise.all([
      supabase.from("ranges_of_approval").select("*").in("wpq_id", inIds),
      supabase
        .from("validation_records")
        .select("*")
        .in("wpq_id", inIds)
        .order("validated_on", { ascending: false }),
      supabase.from("ndt_dt_records").select("*").in("wpq_id", inIds),
    ]);

  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );
  const validations = (validationRows ?? []) as ValidationRecord[];
  const validationsByWpq = new Map<string, ValidationRecord[]>();
  for (const v of validations) {
    const arr = validationsByWpq.get(v.wpq_id) ?? [];
    arr.push(v);
    validationsByWpq.set(v.wpq_id, arr);
  }

  const ndtByWpq = new Map<string, NdtDtRecord[]>();
  for (const r of (ndtRows ?? []) as NdtDtRecord[]) {
    const arr = ndtByWpq.get(r.wpq_id) ?? [];
    arr.push(r);
    ndtByWpq.set(r.wpq_id, arr);
  }

  function ndtViewsFor(wpqId: string) {
    const records = ndtByWpq.get(wpqId) ?? [];
    const order = ALL_NDT_TESTS as readonly string[];
    const rank = (method: string) => {
      const i = order.indexOf(method);
      return i === -1 ? 99 : i;
    };
    return [...records]
      .sort((a, b) => rank(a.test_method) - rank(b.test_method))
      .map((r) => ({
        id: r.id,
        label: r.test_method,
        result: r.result,
        testDate: r.test_date ? formatDate(r.test_date) : null,
        reportRef: r.conducted_by,
        hasReport: Boolean(r.report_pdf_path),
      }));
  }

  const docUrlEntries = await Promise.all(
    validations
      .filter((v) => v.supporting_doc_path)
      .map(
        async (v) =>
          [v.id, await resolveUrl("ndt-reports", v.supporting_doc_path)] as const,
      ),
  );
  const docUrlById = new Map(docUrlEntries);

  const listItems = pageWpqs.map((q) => welderQualListItem(q));
  let selected = selectedWpqRecord
    ? welderQualDetailView(
        selectedWpqRecord,
        ranges,
        validationsByWpq,
        docUrlById,
        ndtViewsFor,
      )
    : null;

  if (selected && selectedWpqId) {
    const groupSession = await findSessionForQualification(
      supabase,
      selectedWpqId,
    );
    if (groupSession) {
      selected = {
        ...selected,
        groupSessionHref: `/welders/qualify/group/${groupSession.sessionId}`,
        groupSessionLabel: groupSession.label ?? "Group session",
      };
    }
  }

  return {
    listItems,
    selected,
    selectedId: selectedWpqId,
    totalCount,
    page: safePage,
  };
}
