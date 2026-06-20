import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/utils";
import { buildIdCardPayload } from "@/lib/iso9606/id-card-model";
import { summarizeWelder } from "@/lib/welder-status";
import type { Organization, QualificationRecord, RangeOfApproval, Welder } from "@/types/db";
import { ShieldAlert } from "lucide-react";
import { DemoVerifyPage } from "@/components/marketing/demo-verify";
import { WelderIdCardView } from "@/components/verify/welder-id-card-view";

export const metadata: Metadata = {
  title: "Welder ID",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (token === "demo") {
    return <DemoVerifyPage />;
  }

  const supabase = createAdminClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("*")
    .eq("qr_token", token)
    .maybeSingle();

  if (!welder) return <NotFound />;
  const w = welder as Welder;

  const [{ data: org }, { data: wpqRows }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", w.org_id).single(),
    supabase
      .from("qualification_records")
      .select("*")
      .eq("welder_id", w.id),
  ]);
  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const orgRow = org as Organization | null;

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

  const card = buildIdCardPayload(w, wpqs, ranges);
  const summary = summarizeWelder(w, wpqs);

  const photoUrl = w.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/welder-photos/${w.photo_path}`
    : null;
  const logoUrl = orgRow?.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-assets/${orgRow.logo_path}`
    : null;

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Live welder ID</span>
        </div>

        <WelderIdCardView
          orgName={orgRow?.name ?? "WeldDoc"}
          welderName={card.welderName}
          welderNo={card.welderNo}
          uid={w.uid}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          rows={card.rows}
          status={summary.overall}
          expiry={
            summary.nearestExpiry ? formatDate(summary.nearestExpiry) : null
          }
          employer={w.employer}
          site={w.branch_location ?? orgRow?.location_code ?? "—"}
        />

        <p className="mt-6 text-center text-xs text-steel">
          Verified live via WeldDoc · {formatDate(new Date())}
        </p>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-4">
      <div className="max-w-sm text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-expired" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-onyx">
          Welder not found
        </h1>
        <p className="mt-2 text-graphite">
          This QR code does not match any welder on record. Please check with
          the welding engineer.
        </p>
      </div>
    </main>
  );
}
