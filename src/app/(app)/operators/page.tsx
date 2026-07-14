import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AddOperatorButton } from "@/components/app/add-operator-button";
import { ImportOperatorsButton } from "@/components/app/import-operators-button";
import { BulkQrPrintButton } from "@/components/app/bulk-qr-print-button";
import { AlertEmailConfigDialog } from "@/components/app/alert-email-config-dialog";
import { updateAlertEmailSettings } from "@/app/(app)/settings/actions";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { summarizeOperator } from "@/lib/operator-status";
import { normalizePlantOperatorId } from "@/lib/operators/plant-id";
import { filterOperatorRows } from "@/lib/operators/filter-rows";
import {
  parseRegistryListPage,
  registryListRange,
} from "@/lib/registry/list-pagination";
import { OperatorsTable, type OperatorRow } from "./operators-table";
import { resolveUrl } from "@/lib/storage";
import type { Operator, OperatorQualification } from "@/types/db";

export const metadata: Metadata = { title: "Operators" };

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  process?: string;
};

export default async function OperatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page: pageParam, q = "", status = "all", process: processFilter = "all" } =
    await searchParams;
  const requestedPage = parseRegistryListPage(pageParam);
  const { org } = await requireSession();
  const supabase = await createClient();

  const [{ data: operators }, { data: oqs }] = await Promise.all([
    supabase
      .from("operators")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase.from("operator_qualifications").select("*").eq("org_id", org.id),
  ]);

  const oqByOperator = new Map<string, OperatorQualification[]>();
  for (const o of (oqs ?? []) as OperatorQualification[]) {
    const arr = oqByOperator.get(o.operator_id) ?? [];
    arr.push(o);
    oqByOperator.set(o.operator_id, arr);
  }

  const allRows: OperatorRow[] = ((operators ?? []) as Operator[]).map((o) => ({
    id: o.id,
    operator_id:
      normalizePlantOperatorId(o.operator_id) ?? o.operator_id?.trim() ?? "—",
    full_name: o.full_name,
    photoUrl: null,
    summary: summarizeOperator(o, oqByOperator.get(o.id) ?? []),
  }));

  const processOptions = Array.from(
    new Set(allRows.flatMap((r) => r.summary.processes)),
  ).sort();

  const filtered = filterOperatorRows(allRows, { q, status, process: processFilter });
  const { safePage, from, to } = registryListRange(
    requestedPage,
    filtered.length,
  );
  const pageSlice = filtered.slice(from, to);
  const operatorById = new Map(
    ((operators ?? []) as Operator[]).map((o) => [o.id, o]),
  );
  const pageRows: OperatorRow[] = await Promise.all(
    pageSlice.map(async (row) => ({
      ...row,
      photoUrl: await resolveUrl(
        "welder-photos",
        operatorById.get(row.id)?.photo_path ?? null,
      ),
    })),
  );

  const qrEntries = ((operators ?? []) as Operator[]).map((o) => ({
    qrToken: o.qr_token,
    plantWelderId:
      normalizePlantOperatorId(o.operator_id) ?? o.operator_id?.trim() ?? "—",
  }));

  return (
    <>
      <PageHeader
        title="Operators"
        description="Your central operator registry."
      >
        <div className="flex flex-wrap items-center gap-2">
          <BulkQrPrintButton entries={qrEntries} />
          <AlertEmailConfigDialog org={org} action={updateAlertEmailSettings} />
          <ImportOperatorsButton />
          <AddOperatorButton />
        </div>
      </PageHeader>
      <div className="page-content">
        {allRows.length === 0 ? (
          <EmptyState />
        ) : (
          <OperatorsTable
            rows={pageRows}
            page={safePage}
            filteredCount={filtered.length}
            q={q}
            status={status}
            process={processFilter}
            processOptions={processOptions}
          />
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-panel px-6 py-16 text-center">
      <h3 className="font-display text-lg font-semibold text-onyx">
        No operators yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-graphite">
        Add your first operator to start issuing ISO 14732 qualifications,
        certificates and QR-verifiable ID cards — or import existing operators
        from Excel using the actions above.
      </p>
    </div>
  );
}
