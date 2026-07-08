import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AddWelderButton } from "@/components/app/add-welder-button";
import { ImportWeldersButton } from "@/components/app/import-welders-button";
import { BulkQrPrintButton } from "@/components/app/bulk-qr-print-button";
import { AlertEmailConfigDialog } from "@/components/app/alert-email-config-dialog";
import { updateAlertEmailSettings } from "@/app/(app)/settings/actions";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { summarizeWelder } from "@/lib/welder-status";
import { normalizePlantWelderId } from "@/lib/welders/plant-id";
import { filterWelderRows } from "@/lib/welders/filter-rows";
import {
  parseRegistryListPage,
  registryListRange,
} from "@/lib/registry/list-pagination";
import { WeldersTable, type WelderRow } from "./welders-table";
import type { QualificationRecord, Welder } from "@/types/db";

export const metadata: Metadata = { title: "Welders" };

type SearchParams = {
  page?: string;
  q?: string;
  status?: string;
  process?: string;
};

export default async function WeldersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page: pageParam, q = "", status = "all", process: processFilter = "all" } =
    await searchParams;
  const requestedPage = parseRegistryListPage(pageParam);
  const { org } = await requireSession();
  const supabase = await createClient();

  const [{ data: welders }, { data: wpqs }] = await Promise.all([
    supabase
      .from("welders")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    supabase.from("qualification_records").select("*").eq("org_id", org.id),
  ]);

  const wpqByWelder = new Map<string, QualificationRecord[]>();
  for (const w of (wpqs ?? []) as QualificationRecord[]) {
    const arr = wpqByWelder.get(w.welder_id) ?? [];
    arr.push(w);
    wpqByWelder.set(w.welder_id, arr);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const allRows: WelderRow[] = ((welders ?? []) as Welder[]).map((w) => ({
    id: w.id,
    welder_id:
      normalizePlantWelderId(w.welder_id) ?? w.welder_id?.trim() ?? "—",
    full_name: w.full_name,
    photoUrl: w.photo_path
      ? `${supabaseUrl}/storage/v1/object/public/welder-photos/${w.photo_path}`
      : null,
    summary: summarizeWelder(w, wpqByWelder.get(w.id) ?? []),
  }));

  const processOptions = Array.from(
    new Set(allRows.flatMap((r) => r.summary.processes)),
  ).sort();

  const filtered = filterWelderRows(allRows, { q, status, process: processFilter });
  const { safePage, from, to } = registryListRange(
    requestedPage,
    filtered.length,
  );
  const pageRows = filtered.slice(from, to);

  const qrEntries = ((welders ?? []) as Welder[]).map((w) => ({
    qrToken: w.qr_token,
    plantWelderId:
      normalizePlantWelderId(w.welder_id) ?? w.welder_id?.trim() ?? "—",
  }));

  return (
    <>
      <PageHeader
        title="Welders"
        description="Your central welder registry. Search, filter and open a profile."
      >
        <div className="flex flex-wrap items-center gap-2">
          <BulkQrPrintButton entries={qrEntries} />
          <AlertEmailConfigDialog org={org} action={updateAlertEmailSettings} />
          <ImportWeldersButton />
          <AddWelderButton />
        </div>
      </PageHeader>
      <div className="px-8 py-8">
        {allRows.length === 0 ? (
          <EmptyState />
        ) : (
          <WeldersTable
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
        No welders yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-graphite">
        Add your first welder to start issuing qualifications, certificates and
        QR-verifiable ID cards — or import existing welders from Excel using
        the actions above.
      </p>
    </div>
  );
}
