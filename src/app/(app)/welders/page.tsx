import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AddWelderButton } from "@/components/app/add-welder-button";
import { BulkQrPrintButton } from "@/components/app/bulk-qr-print-button";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { summarizeWelder } from "@/lib/welder-status";
import { WeldersTable, type WelderRow } from "./welders-table";
import type { QualificationRecord, Welder } from "@/types/db";

export const metadata: Metadata = { title: "Welders" };

export default async function WeldersPage() {
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
  const rows: WelderRow[] = ((welders ?? []) as Welder[]).map((w) => ({
    id: w.id,
    uid: w.uid,
    welder_id: w.welder_id,
    full_name: w.full_name,
    photoUrl: w.photo_path
      ? `${supabaseUrl}/storage/v1/object/public/welder-photos/${w.photo_path}`
      : null,
    summary: summarizeWelder(w, wpqByWelder.get(w.id) ?? []),
  }));

  const qrEntries = ((welders ?? []) as Welder[]).map((w) => ({
    qrToken: w.qr_token,
    plantWelderId: w.welder_id ?? w.uid,
  }));

  return (
    <>
      <PageHeader
        title="Welders"
        description="Your central welder registry. Search, filter and open a profile."
      >
        <div className="flex items-center gap-2">
          <BulkQrPrintButton entries={qrEntries} />
          <AddWelderButton />
        </div>
      </PageHeader>
      <div className="px-8 py-8">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <WeldersTable rows={rows} />
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
        QR-verifiable ID cards.
      </p>
      <div className="mt-6 flex justify-center">
        <AddWelderButton />
      </div>
    </div>
  );
}
