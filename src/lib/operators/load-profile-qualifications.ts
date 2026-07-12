import type { SupabaseClient } from "@supabase/supabase-js";
import type { QualListItem } from "@/components/qualify/qualification-sidebar";
import type { OperatorQualView } from "@/app/(app)/operators/[id]/operator-qualifications";
import { processLabel, requiredNdtTests } from "@/lib/iso14732/constants";
import {
  parseQualListPage,
  qualListRange,
} from "@/lib/qualify/profile-pagination";
import { daysUntil } from "@/lib/operator-status";
import { isActiveQualification } from "@/lib/qualification-active";
import { operatorContinuityDue } from "@/lib/iso14732/expiry";
import { resolveUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { findSessionForQualification } from "@/lib/qualify/group-session";
import type {
  OperatorQualification,
  OperatorRange,
  OperatorValidation,
  OperatorNdtRecord,
} from "@/types/db";

const OQ_TONE: Record<
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

function operatorQualListItem(q: OperatorQualification): QualListItem {
  const inactive = !isActiveQualification(q);
  const continuityDueIso = q.continuity_last_verified
    ? operatorContinuityDue(q.continuity_last_verified)
    : null;
  return {
    id: q.id,
    title: [processLabel(q.process), q.welding_mode, q.product_type]
      .filter(Boolean)
      .join(" · "),
    subtitle: `ISO 14732 · ${q.welding_type ?? "—"} · Method ${q.revalidation_method}`,
    statusLabel: inactive ? "Inactive" : q.oq_status.replace("_", " "),
    statusTone: inactive ? "neutral" : (OQ_TONE[q.oq_status] ?? "neutral"),
    expiry: formatDate(q.expiry_date),
    daysToExpiry: daysUntil(q.expiry_date),
    continuityDue: continuityDueIso ? formatDate(continuityDueIso) : null,
    daysToContinuityDue: continuityDueIso ? daysUntil(continuityDueIso) : null,
  };
}

function operatorQualDetailView(
  q: OperatorQualification,
  ranges: Map<string, OperatorRange>,
  validationsByOq: Map<string, OperatorValidation[]>,
  docUrlById: Map<string, string | null>,
  ndtViewsFor: (oq: OperatorQualification) => OperatorQualView["ndtRecords"],
): OperatorQualView {
  return {
    ...operatorQualListItem(q),
    status: q.oq_status,
    isActive: isActiveQualification(q),
    isLegacy: q.is_legacy,
    isApproved: q.oq_status === "Approved",
    hasSignedCertificate: Boolean(q.signed_certificate_pdf_path),
    canLogValidation:
      isActiveQualification(q) &&
      (q.oq_status === "Approved" || q.oq_status === "Expired"),
    rangeSummary: ranges.get(q.id)?.summary ?? null,
    ndtRecords: ndtViewsFor(q),
    validations: (validationsByOq.get(q.id) ?? []).map((v) => {
      const nextContIso =
        v.kind === "continuity" || v.kind === "revalidation"
          ? operatorContinuityDue(v.validated_on)
          : null;
      return {
        id: v.id,
        kind: v.kind,
        validatedOn: formatDate(v.validated_on),
        validatorName: v.validator_name,
        note: v.note,
        newExpiry: v.new_expiry_date ? formatDate(v.new_expiry_date) : null,
        nextContinuityDue: nextContIso ? formatDate(nextContIso) : null,
        docUrl: docUrlById.get(v.id) ?? null,
      };
    }),
  };
}

export async function loadOperatorProfileQualifications(
  supabase: SupabaseClient,
  operatorId: string,
  selectedOqParam: string | undefined,
  pageParam: string | undefined,
) {
  const requestedPage = parseQualListPage(pageParam);

  const { data: allOqRows } = await supabase
    .from("operator_qualifications")
    .select("id")
    .eq("operator_id", operatorId);
  const allIds = (allOqRows ?? []).map((r) => r.id);
  const totalCount = allIds.length;

  const { safePage, from, to } = qualListRange(requestedPage, totalCount);

  const { data: oqRows } = await supabase
    .from("operator_qualifications")
    .select("*")
    .eq("operator_id", operatorId)
    .order("created_at", { ascending: false })
    .range(from, to);
  const pageOqs = (oqRows ?? []) as OperatorQualification[];

  let selectedOqId =
    selectedOqParam && allIds.includes(selectedOqParam)
      ? selectedOqParam
      : (pageOqs[0]?.id ?? allIds[0] ?? null);

  let selectedOqRecord =
    pageOqs.find((q) => q.id === selectedOqId) ?? null;
  if (selectedOqId && !selectedOqRecord) {
    const { data: selectedRow } = await supabase
      .from("operator_qualifications")
      .select("*")
      .eq("id", selectedOqId)
      .eq("operator_id", operatorId)
      .single();
    selectedOqRecord = (selectedRow as OperatorQualification | null) ?? null;
    if (!selectedOqRecord) selectedOqId = pageOqs[0]?.id ?? null;
  }

  const relatedOqIds = [
    ...new Set([
      ...pageOqs.map((q) => q.id),
      ...(selectedOqId ? [selectedOqId] : []),
    ]),
  ];

  const emptyId = "00000000-0000-0000-0000-000000000000";
  const inIds = relatedOqIds.length ? relatedOqIds : [emptyId];

  const [{ data: rangeRows }, { data: validationRows }, { data: ndtRows }] =
    await Promise.all([
      supabase.from("operator_ranges").select("*").in("oq_id", inIds),
      supabase
        .from("operator_validations")
        .select("*")
        .in("oq_id", inIds)
        .order("validated_on", { ascending: false }),
      supabase.from("operator_ndt_records").select("*").in("oq_id", inIds),
    ]);

  const ranges = new Map(
    ((rangeRows ?? []) as OperatorRange[]).map((r) => [r.oq_id, r]),
  );
  const validations = (validationRows ?? []) as OperatorValidation[];
  const validationsByOq = new Map<string, OperatorValidation[]>();
  for (const v of validations) {
    const arr = validationsByOq.get(v.oq_id) ?? [];
    arr.push(v);
    validationsByOq.set(v.oq_id, arr);
  }

  const ndtByOq = new Map<string, OperatorNdtRecord[]>();
  for (const r of (ndtRows ?? []) as OperatorNdtRecord[]) {
    const arr = ndtByOq.get(r.oq_id) ?? [];
    arr.push(r);
    ndtByOq.set(r.oq_id, arr);
  }

  function ndtLabelFor(oq: OperatorQualification, method: string): string {
    return (
      requiredNdtTests(oq).find((s) => s.method === method)?.label ?? method
    );
  }

  function ndtViewsFor(oq: OperatorQualification) {
    const records = ndtByOq.get(oq.id) ?? [];
    const order = requiredNdtTests(oq).map((t) => t.method);
    return [...records]
      .sort(
        (a, b) =>
          (order.indexOf(a.test_method) === -1
            ? 99
            : order.indexOf(a.test_method)) -
          (order.indexOf(b.test_method) === -1
            ? 99
            : order.indexOf(b.test_method)),
      )
      .map((r) => ({
        id: r.id,
        label: ndtLabelFor(oq, r.test_method),
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

  const listItems = pageOqs.map((q) => operatorQualListItem(q));
  let selected = selectedOqRecord
    ? operatorQualDetailView(
        selectedOqRecord,
        ranges,
        validationsByOq,
        docUrlById,
        ndtViewsFor,
      )
    : null;

  if (selected && selectedOqId) {
    const groupSession = await findSessionForQualification(
      supabase,
      selectedOqId,
    );
    if (groupSession) {
      selected = {
        ...selected,
        groupSessionHref: `/operators/qualify/group/${groupSession.sessionId}`,
        groupSessionLabel: groupSession.label ?? "Group session",
      };
    }
  }

  return {
    listItems,
    selected,
    selectedId: selectedOqId,
    totalCount,
    page: safePage,
  };
}
