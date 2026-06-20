import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/brand/logo";
import { formatDate } from "@/lib/utils";
import { summarizeWelder } from "@/lib/welder-status";
import { resolvePublicUrl } from "@/lib/storage-public";
import type { Organization, QualificationRecord, Welder } from "@/types/db";
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
      .eq("welder_id", w.id)
      .eq("wpq_status", "Approved"),
  ]);
  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const summary = summarizeWelder(w, wpqs);
  const orgRow = org as Organization | null;

  const photoUrl = w.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/welder-photos/${w.photo_path}`
    : null;
  const logoUrl = orgRow?.logo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/org-assets/${orgRow.logo_path}`
    : null;

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Live welder ID</span>
        </div>

        <WelderIdCardView
          org={{
            name: orgRow?.name ?? "WeldDoc",
            location_code: orgRow?.location_code ?? null,
          }}
          welder={w}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          processes={summary.processes}
          status={summary.overall}
          expiry={
            summary.nearestExpiry ? formatDate(summary.nearestExpiry) : null
          }
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
