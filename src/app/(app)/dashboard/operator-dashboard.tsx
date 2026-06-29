import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DonutCard, type Slice } from "@/components/app/dashboard-charts";
import { DashboardStat } from "@/components/app/dashboard-stat";
import {
  chartGridClass,
  kpiGridClass,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { processLabel } from "@/lib/iso14732/constants";
import {
  summarizeOperator,
  daysUntil,
  STATUS_TONE,
  type OverallStatus,
} from "@/lib/operator-status";
import { formatDate } from "@/lib/utils";
import type { Operator, OperatorQualification } from "@/types/db";

export function OperatorDashboard({
  widgets,
  operators,
  oqs,
}: {
  widgets: Set<DashboardWidgetId>;
  operators: Operator[];
  oqs: OperatorQualification[];
}) {
  const oqByOperator = new Map<string, OperatorQualification[]>();
  for (const o of oqs) {
    const arr = oqByOperator.get(o.operator_id) ?? [];
    arr.push(o);
    oqByOperator.set(o.operator_id, arr);
  }

  const statusCounts: Record<string, number> = {};
  for (const o of operators) {
    const s = summarizeOperator(o, oqByOperator.get(o.id) ?? []).overall;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }
  const statusSplit: Slice[] = Object.entries(statusCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const approved = oqs.filter((o) => o.oq_status === "Approved");

  const processCounts: Record<string, number> = {};
  for (const o of approved) {
    const p = processLabel(o.process);
    processCounts[p] = (processCounts[p] ?? 0) + 1;
  }
  const byProcess: Slice[] = Object.entries(processCounts).map(
    ([name, value]) => ({ name, value }),
  );

  const typeCounts = { Fusion: 0, Resistance: 0 };
  for (const o of approved) {
    if (o.welding_type === "Fusion") typeCounts.Fusion += 1;
    else if (o.welding_type === "Resistance") typeCounts.Resistance += 1;
  }
  const byWeldingType: Slice[] = [
    { name: "Fusion", value: typeCounts.Fusion },
    { name: "Resistance", value: typeCounts.Resistance },
  ].filter((s) => s.value > 0);

  const processesSeen = Array.from(
    new Set(approved.map((o) => processLabel(o.process))),
  );
  const coverage = processesSeen.map((p) => {
    const fusion = approved.filter(
      (o) => processLabel(o.process) === p && o.welding_type === "Fusion",
    ).length;
    const resistance = approved.filter(
      (o) => processLabel(o.process) === p && o.welding_type === "Resistance",
    ).length;
    return { process: p, fusion, resistance };
  });

  const expiring = approved
    .map((o) => ({
      oq: o,
      operator: operators.find((x) => x.id === o.operator_id),
      days: daysUntil(o.expiry_date),
    }))
    .filter((e) => e.days !== null && e.days <= 60)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

  const expiringSoon = expiring.filter(
    (e) => e.days !== null && e.days >= 0,
  ).length;
  const overdue = expiring.filter((e) => e.days !== null && e.days < 0).length;
  const activeQuals = approved.filter((o) => {
    const d = daysUntil(o.expiry_date);
    return d === null || d >= 0;
  }).length;

  const kpiItems = [
    widgets.has("kpi_total_operators") ? (
      <DashboardStat
        key="kpi_total_operators"
        tone="brand"
        label="Total operators"
        value={operators.length}
        hint="Registered in your organisation"
        href="/operators"
      />
    ) : null,
    widgets.has("kpi_active_operator_qualifications") ? (
      <DashboardStat
        key="kpi_active_operator_qualifications"
        tone="active"
        label="Active qualifications"
        value={activeQuals}
        hint={`${approved.length} approved on record`}
      />
    ) : null,
    widgets.has("kpi_operator_expiring_soon") ? (
      <DashboardStat
        key="kpi_operator_expiring_soon"
        tone="warning"
        label="Expiring soon"
        value={expiringSoon}
        hint="Within the next 60 days"
      />
    ) : null,
    widgets.has("kpi_operator_overdue") ? (
      <DashboardStat
        key="kpi_operator_overdue"
        tone="danger"
        label="Overdue"
        value={overdue}
        hint={overdue > 0 ? "Needs revalidation or continuity" : "All clear"}
      />
    ) : null,
  ].filter(Boolean);

  const chartItems = [
    widgets.has("chart_operator_status") ? (
      <DonutCard
        key="chart_operator_status"
        title="Operator status"
        data={statusSplit}
        useStatusColors
      />
    ) : null,
    widgets.has("chart_operator_qual_by_process") ? (
      <DonutCard
        key="chart_operator_qual_by_process"
        title="Qualifications by process"
        data={byProcess}
      />
    ) : null,
    widgets.has("chart_operator_qual_by_welding_type") ? (
      <DonutCard
        key="chart_operator_qual_by_welding_type"
        title="By welding type"
        data={byWeldingType}
      />
    ) : null,
  ].filter(Boolean);

  const showCoverage = widgets.has("section_operator_coverage");
  const showNeedsAttention = widgets.has("section_operator_needs_attention");
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
                Qualified operators per process and welding type. Zeros flag a
                gap.
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
                      <th className="py-2 font-medium">Fusion</th>
                      <th className="py-2 font-medium">Resistance</th>
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
                          <CoverageCell n={c.fusion} />
                        </td>
                        <td className="py-2.5">
                          <CoverageCell n={c.resistance} />
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
                Operator qualifications expiring within 60 days or overdue.
              </p>
              <div className="mt-4 space-y-2">
                {expiring.length === 0 ? (
                  <p className="text-sm text-steel">Nothing expiring soon.</p>
                ) : (
                  expiring.slice(0, 8).map((e) => (
                    <Link
                      key={e.oq.id}
                      href={`/operators/${e.operator?.id}`}
                      className="flex items-center justify-between rounded-[10px] border border-silver px-3 py-2 hover:bg-frost/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-onyx">
                          {e.operator?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-steel">
                          {processLabel(e.oq.process)} ·{" "}
                          {formatDate(e.oq.expiry_date)}
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
