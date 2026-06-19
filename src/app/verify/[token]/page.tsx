import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { processLabel, POSITION_LABELS } from "@/lib/iso9606/constants";
import {
  summarizeWelder,
  STATUS_TONE,
  daysUntil,
} from "@/lib/welder-status";
import type {
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Welder verification",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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

  const { data: rangeRows } = await supabase
    .from("ranges_of_approval")
    .select("*")
    .in(
      "wpq_id",
      wpqs.length ? wpqs.map((q) => q.id) : ["00000000-0000-0000-0000-000000000000"],
    );
  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );

  const summary = summarizeWelder(w, wpqs);
  const qualified = summary.overall === "Active" || summary.overall === "Expiring";

  const photoUrl = w.photo_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/welder-photos/${w.photo_path}`
    : null;

  const liveWpqs = wpqs.filter((q) => {
    const d = daysUntil(q.expiry_date);
    return d === null || d >= 0;
  });

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Logo />
          <span className="text-xs text-steel">Auditor verification</span>
        </div>

        {/* Status banner */}
        <div
          className={`rounded-[var(--radius-feature)] p-6 text-center ${
            qualified
              ? "bg-active text-white"
              : "bg-expired text-white"
          }`}
        >
          {qualified ? (
            <ShieldCheck className="mx-auto h-10 w-10" />
          ) : (
            <ShieldX className="mx-auto h-10 w-10" />
          )}
          <p className="mt-3 font-display text-2xl font-bold tracking-tight">
            {qualified ? "QUALIFIED" : "NOT QUALIFIED"}
          </p>
          <p className="mt-1 text-sm opacity-90">
            {qualified
              ? "This welder holds valid EN ISO 9606-1 qualifications."
              : summary.overall === "Expired"
                ? "All qualifications have expired."
                : summary.overall === "Inactive" ||
                    summary.overall === "Suspended"
                  ? `Welder is ${summary.overall.toLowerCase()}.`
                  : "No valid qualification on record."}
          </p>
        </div>

        {/* Identity */}
        <div className="mt-4 rounded-[var(--radius-card)] border border-silver bg-white p-5">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={w.full_name}
                className="h-20 w-20 rounded-[12px] object-cover"
              />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-[12px] bg-onyx/5 font-display text-2xl font-semibold text-graphite">
                {w.full_name.slice(0, 1)}
              </span>
            )}
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-onyx">
                {w.full_name}
              </h1>
              <p className="font-mono text-[13px] text-charcoal">{w.uid}</p>
              {w.welder_id && (
                <p className="text-xs text-steel">{w.welder_id}</p>
              )}
              <div className="mt-1.5">
                <Badge tone={STATUS_TONE[summary.overall]}>
                  {summary.overall}
                </Badge>
              </div>
            </div>
          </div>
          {org && (
            <p className="mt-4 border-t border-silver pt-3 text-sm text-graphite">
              {(org as Organization).name}
            </p>
          )}
        </div>

        {/* Qualifications */}
        {liveWpqs.length > 0 && (
          <div className="mt-4 space-y-3">
            <h2 className="px-1 font-display text-sm font-semibold uppercase tracking-wide text-steel">
              Valid qualifications
            </h2>
            {liveWpqs.map((q) => {
              const range = ranges.get(q.id);
              return (
                <div
                  key={q.id}
                  className="rounded-[var(--radius-card)] border border-silver bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[15px] font-semibold text-onyx">
                      {processLabel(q.process)} ·{" "}
                      {q.joint_type === "BW" ? "Butt" : "Fillet"}
                    </p>
                    <span className="text-xs text-steel">
                      exp. {formatDate(q.expiry_date)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] text-graphite">
                    Position{" "}
                    {q.position
                      ? POSITION_LABELS[q.position] ?? q.position
                      : "—"}{" "}
                    · {q.product}
                  </p>
                  {range?.summary && (
                    <p className="mt-2 rounded-[8px] bg-frost p-2.5 text-[12.5px] leading-snug text-charcoal">
                      {range.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
