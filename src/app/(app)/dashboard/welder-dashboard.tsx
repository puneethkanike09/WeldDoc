import {
  BarCard,
  DonutCard,
  type Slice,
} from "@/components/app/dashboard-charts";
import { DashboardStat } from "@/components/app/dashboard-stat";
import { aggregateWelderMasterCharts } from "@/lib/dashboard/aggregate-charts";
import {
  chartGridClass,
  kpiGridClass,
  sortByWidgetOrder,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { summarizeWelder, daysUntil } from "@/lib/welder-status";
import type { QualificationRecord, RangeOfApproval, Welder } from "@/types/db";

export function WelderDashboard({
  order,
  welders,
  wpqs,
  ranges,
}: {
  order: DashboardWidgetId[];
  welders: Welder[];
  wpqs: QualificationRecord[];
  ranges: Map<string, RangeOfApproval>;
}) {
  const widgets = new Set(order);
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
  const masterCharts = aggregateWelderMasterCharts(approved, ranges);

  const expiring = approved
    .map((w) => ({ days: daysUntil(w.expiry_date) }))
    .filter((e) => e.days !== null && e.days <= 60);

  const expiringSoon = expiring.filter(
    (e) => e.days !== null && e.days >= 0,
  ).length;
  const overdue = expiring.filter((e) => e.days !== null && e.days < 0).length;
  const activeQuals = approved.filter((w) => {
    const d = daysUntil(w.expiry_date);
    return d === null || d >= 0;
  }).length;

  const kpiEntries: { id: DashboardWidgetId; el: React.ReactNode }[] = [
    {
      id: "kpi_total_welders",
      el: (
        <DashboardStat
          key="kpi_total_welders"
          tone="brand"
          label="Total welders"
          value={welders.length}
          hint="Registered in your organisation"
          href="/welders"
        />
      ),
    },
    {
      id: "kpi_active_qualifications",
      el: (
        <DashboardStat
          key="kpi_active_qualifications"
          tone="active"
          label="Active qualifications"
          value={activeQuals}
          hint={`${approved.length} approved on record`}
        />
      ),
    },
    {
      id: "kpi_expiring_soon",
      el: (
        <DashboardStat
          key="kpi_expiring_soon"
          tone="warning"
          label="Expiring soon"
          value={expiringSoon}
          hint="Within the next 60 days"
        />
      ),
    },
    {
      id: "kpi_overdue",
      el: (
        <DashboardStat
          key="kpi_overdue"
          tone="danger"
          label="Overdue"
          value={overdue}
          hint={overdue > 0 ? "Needs revalidation or continuity" : "All clear"}
        />
      ),
    },
  ];
  const kpiItems = sortByWidgetOrder(
    kpiEntries.filter((e) => widgets.has(e.id)),
    order,
  ).map((e) => e.el);

  const chartEntries: { id: DashboardWidgetId; el: React.ReactNode }[] = [
    {
      id: "chart_welder_status",
      el: (
        <DonutCard
          key="chart_welder_status"
          title="Welder status"
          data={statusSplit}
          useStatusColors
        />
      ),
    },
    {
      id: "chart_qual_by_process",
      el: (
        <DonutCard
          key="chart_qual_by_process"
          title="Qualifications by process"
          data={masterCharts.byProcess}
        />
      ),
    },
    {
      id: "chart_qual_by_position",
      el: (
        <DonutCard
          key="chart_qual_by_position"
          title="By position"
          data={masterCharts.byPosition}
        />
      ),
    },
    {
      id: "chart_qual_by_fm_group",
      el: (
        <DonutCard
          key="chart_qual_by_fm_group"
          title="By FM group"
          data={masterCharts.byFmGroup}
        />
      ),
    },
    {
      id: "chart_qual_by_product",
      el: (
        <DonutCard
          key="chart_qual_by_product"
          title="By product type"
          data={masterCharts.byProduct}
        />
      ),
    },
    {
      id: "chart_qual_by_joint",
      el: (
        <DonutCard
          key="chart_qual_by_joint"
          title="By joint type"
          data={masterCharts.byJoint}
        />
      ),
    },
    {
      id: "chart_qual_by_thickness",
      el: (
        <BarCard
          key="chart_qual_by_thickness"
          title="By thickness"
          data={masterCharts.byThickness}
        />
      ),
    },
    {
      id: "chart_qual_by_diameter",
      el: (
        <BarCard
          key="chart_qual_by_diameter"
          title="By pipe OD"
          data={masterCharts.byDiameter}
        />
      ),
    },
  ];
  const chartItems = sortByWidgetOrder(
    chartEntries.filter((e) => widgets.has(e.id)),
    order,
  ).map((e) => e.el);

  return (
    <div className="space-y-6 px-8 py-8">
      {kpiItems.length > 0 ? (
        <div className={kpiGridClass(kpiItems.length)}>{kpiItems}</div>
      ) : null}

      {chartItems.length > 0 ? (
        <div className={chartGridClass(chartItems.length)}>{chartItems}</div>
      ) : null}
    </div>
  );
}
