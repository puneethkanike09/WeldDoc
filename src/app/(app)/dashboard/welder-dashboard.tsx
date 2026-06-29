import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DonutCard, type Slice } from "@/components/app/dashboard-charts";
import { DashboardStat } from "@/components/app/dashboard-stat";
import {
  chartGridClass,
  kpiGridClass,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { processLabel } from "@/lib/iso9606/constants";
import {
  summarizeWelder,
  daysUntil,
  STATUS_TONE,
  type OverallStatus,
} from "@/lib/welder-status";
import { formatDate } from "@/lib/utils";
import type { QualificationRecord, Welder } from "@/types/db";

export function WelderDashboard({
  widgets,
  welders,
  wpqs,
}: {
  widgets: Set<DashboardWidgetId>;
  welders: Welder[];
  wpqs: QualificationRecord[];
}) {
  const wpqByWelder = new Map<string, QualificationRecord[]>();
  for (const w of wpqs) {
    const arr = wpqByWelder.get(w.welder_id) ?? [];
    arr.push(w);
    wpqByWelder.set(w.welder_id, arr);
  }

  const statusCounts: Record<string, number> = {};
  for (const w of welders) {
    const s = summarizeWelder(w, wpqByWelder.get(w.id) ?? []).overall;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const statusSplit: Slice[] = Object.entries(statusCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const approved = wpqs.filter((w) => w.wpq_status === "Approved");

  const processCounts: Record<string, number> = {};
  for (const w of approved) {
    const p = processLabel(w.process);
    processCounts[p] = (processCounts[p] ?? 0) + 1;
  }
  const byProcess: Slice[] = Object.entries(processCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const jointCounts = { Butt: 0, Fillet: 0 };
  for (const w of approved) {
    if (w.joint_type === "BW") jointCounts.Butt += 1;
    else jointCounts.Fillet += 1;
  }
  const byJoint: Slice[] = [
    { name: "Butt weld", value: jointCounts.Butt },
    { name: "Fillet weld", value: jointCounts.Fillet },
  ].filter((s) => s.value > 0);

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

  const kpiItems = [
    widgets.has("kpi_total_welders") ? (
      <DashboardStat
        key="kpi_total_welders"
        tone="brand"
        label="Total welders"
        value={welders.length}
        hint="Registered in your organisation"
        href="/welders"
      />
    ) : null,
    widgets.has("kpi_active_qualifications") ? (
      <DashboardStat
        key="kpi_active_qualifications"
        tone="active"
        label="Active qualifications"
        value={activeQuals}
        hint={`${approved.length} approved on record`}
      />
    ) : null,
    widgets.has("kpi_expiring_soon") ? (
      <DashboardStat
        key="kpi_expiring_soon"
        tone="warning"
        label="Expiring soon"
        value={expiringSoon}
        hint="Within the next 60 days"
      />
    ) : null,
    widgets.has("kpi_overdue") ? (
      <DashboardStat
        key="kpi_overdue"
        tone="danger"
        label="Overdue"
        value={overdue}
        hint={overdue > 0 ? "Needs revalidation or continuity" : "All clear"}
      />
    ) : null,
  ].filter(Boolean);

  const chartItems = [
    widgets.has("chart_welder_status") ? (
      <DonutCard
        key="chart_welder_status"
        title="Welder status"
        data={statusSplit}
        useStatusColors
      />
    ) : null,
    widgets.has("chart_qual_by_process") ? (
      <DonutCard
        key="chart_qual_by_process"
        title="Qualifications by process"
        data={byProcess}
      />
    ) : null,
    widgets.has("chart_qual_by_joint") ? (
      <DonutCard key="chart_qual_by_joint" title="By joint type" data={byJoint} />
    ) : null,
  ].filter(Boolean);

  const showCoverage = widgets.has("section_category_coverage");
  const showNeedsAttention = widgets.has("section_needs_attention");
  const sectionGridClass =
    showCoverage && showNeedsAttention
      ? "grid gap-4 lg:grid-cols-[1.2fr_1fr]"
      : "grid gap-4 grid-cols-1";

  return (
    <div className="space-y-6 px-8 py-8">
      {kpiItems.length > 0 ? (
        <div className={kpiGridClass(kpiItems.length)}>{kpiItems}</div>
      ) : null}

      {chartItems.length > 0 ? (
        <div className={chartGridClass(chartItems.length)}>{chartItems}</div>
      ) : null}

      {showCoverage || showNeedsAttention ? (
        <div className={sectionGridClass}>
          {showCoverage ? (
            <div className="rounded-[var(--radius-card)] border border-silver bg-panel p-6">
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
                      <tr
                        key={c.process}
                        className="border-b border-silver/60 last:border-0"
                      >
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
          ) : null}

          {showNeedsAttention ? (
            <div className="rounded-[var(--radius-card)] border border-silver bg-panel p-6">
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
                          {processLabel(e.wpq.process)} ·{" "}
                          {formatDate(e.wpq.expiry_date)}
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CoverageCell({ n }: { n: number }) {
  if (n === 0) {
    return <Badge tone="expired">0 — gap</Badge>;
  }
  return <span className="font-display font-semibold text-onyx">{n}</span>;
}
