import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { AddWelderButton } from "@/components/app/add-welder-button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  summarizeWelder,
  daysUntil,
  STATUS_TONE,
  type OverallStatus,
} from "@/lib/welder-status";
import { processLabel } from "@/lib/iso9606/constants";
import { formatDate } from "@/lib/utils";
import { DonutCard, type Slice } from "@/components/app/dashboard-charts";
import { DashboardStat } from "@/components/app/dashboard-stat";
import type { QualificationRecord, Welder } from "@/types/db";

export default async function DashboardPage() {
  const { org, profile, email } = await requireSession();
  const supabase = await createClient();
  const name = profile.full_name || email || "Engineer";

  const [{ data: welderRows }, { data: wpqRows }] = await Promise.all([
    supabase.from("welders").select("*").eq("org_id", org.id),
    supabase.from("qualification_records").select("*").eq("org_id", org.id),
  ]);
  const welders = (welderRows ?? []) as Welder[];
  const wpqs = (wpqRows ?? []) as QualificationRecord[];

  const wpqByWelder = new Map<string, QualificationRecord[]>();
  for (const w of wpqs) {
    const arr = wpqByWelder.get(w.welder_id) ?? [];
    arr.push(w);
    wpqByWelder.set(w.welder_id, arr);
  }

  // Status split.
  const statusCounts: Record<string, number> = {};
  for (const w of welders) {
    const s = summarizeWelder(w, wpqByWelder.get(w.id) ?? []).overall;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const statusSplit: Slice[] = Object.entries(statusCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const approved = wpqs.filter((w) => w.wpq_status === "Approved");

  // By process.
  const processCounts: Record<string, number> = {};
  for (const w of approved) {
    const p = processLabel(w.process);
    processCounts[p] = (processCounts[p] ?? 0) + 1;
  }
  const byProcess: Slice[] = Object.entries(processCounts).map(
    ([name, value]) => ({ name, value }),
  );

  // By joint type.
  const jointCounts = { Butt: 0, Fillet: 0 };
  for (const w of approved) {
    if (w.joint_type === "BW") jointCounts.Butt += 1;
    else jointCounts.Fillet += 1;
  }
  const byJoint: Slice[] = [
    { name: "Butt weld", value: jointCounts.Butt },
    { name: "Fillet weld", value: jointCounts.Fillet },
  ].filter((s) => s.value > 0);

  // Category coverage matrix (process x joint), flag zeros.
  const processesSeen = Array.from(
    new Set(approved.map((w) => processLabel(w.process))),
  );
  const coverage = processesSeen.map((p) => {
    const bw = approved.filter(
      (w) => processLabel(w.process) === p && w.joint_type === "BW",
    ).length;
    const fw = approved.filter(
      (w) => processLabel(w.process) === p && w.joint_type === "FW",
    ).length;
    return { process: p, bw, fw };
  });

  // Expiry.
  const expiring = approved
    .map((w) => ({
      wpq: w,
      welder: welders.find((x) => x.id === w.welder_id),
      days: daysUntil(w.expiry_date),
    }))
    .filter((e) => e.days !== null && e.days <= 60)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

  const expiringSoon = expiring.filter(
    (e) => e.days !== null && e.days >= 0,
  ).length;
  const overdue = expiring.filter((e) => e.days !== null && e.days < 0).length;
  const activeQuals = approved.filter((w) => {
    const d = daysUntil(w.expiry_date);
    return d === null || d >= 0;
  }).length;

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${name}.`}>
        <AddWelderButton />
      </PageHeader>

      <div className="space-y-6 px-8 py-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            tone="brand"
            label="Total welders"
            value={welders.length}
            hint="Registered in your organisation"
            href="/welders"
          />
          <DashboardStat
            tone="active"
            label="Active qualifications"
            value={activeQuals}
            hint={`${approved.length} approved on record`}
          />
          <DashboardStat
            tone="warning"
            label="Expiring soon"
            value={expiringSoon}
            hint="Within the next 60 days"
          />
          <DashboardStat
            tone="danger"
            label="Overdue"
            value={overdue}
            hint={overdue > 0 ? "Needs revalidation or continuity" : "All clear"}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <DonutCard title="Welder status" data={statusSplit} useStatusColors />
          <DonutCard title="Qualifications by process" data={byProcess} />
          <DonutCard title="By joint type" data={byJoint} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Category gap */}
          <div className="rounded-[var(--radius-card)] border border-silver bg-white p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Category coverage
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Qualified welders per process and joint type. Zeros flag a gap.
            </p>
            {coverage.length === 0 ? (
              <p className="mt-6 text-sm text-steel">
                No approved qualifications yet.
              </p>
            ) : (
              <table className="mt-4 w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-silver text-[12px] uppercase tracking-wide text-steel">
                    <th className="py-2 font-medium">Process</th>
                    <th className="py-2 font-medium">Butt weld</th>
                    <th className="py-2 font-medium">Fillet weld</th>
                  </tr>
                </thead>
                <tbody>
                  {coverage.map((c) => (
                    <tr key={c.process} className="border-b border-silver/60 last:border-0">
                      <td className="py-2.5 text-charcoal">{c.process}</td>
                      <td className="py-2.5">
                        <CoverageCell n={c.bw} />
                      </td>
                      <td className="py-2.5">
                        <CoverageCell n={c.fw} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiring soon list */}
          <div className="rounded-[var(--radius-card)] border border-silver bg-white p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Needs attention
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Qualifications expiring within 60 days or overdue.
            </p>
            <div className="mt-4 space-y-2">
              {expiring.length === 0 ? (
                <p className="text-sm text-steel">Nothing expiring soon.</p>
              ) : (
                expiring.slice(0, 8).map((e) => (
                  <Link
                    key={e.wpq.id}
                    href={`/welders/${e.welder?.id}`}
                    className="flex items-center justify-between rounded-[10px] border border-silver px-3 py-2 hover:bg-frost/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-onyx">
                        {e.welder?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-steel">
                        {processLabel(e.wpq.process)} · {formatDate(e.wpq.expiry_date)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        (e.days ?? 0) < 0
                          ? "expired"
                          : STATUS_TONE["Expiring" as OverallStatus]
                      }
                    >
                      {(e.days ?? 0) < 0
                        ? `${Math.abs(e.days ?? 0)}d overdue`
                        : `${e.days}d`}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CoverageCell({ n }: { n: number }) {
  if (n === 0) {
    return <Badge tone="expired">0 — gap</Badge>;
  }
  return <span className="font-display font-semibold text-onyx">{n}</span>;
}
