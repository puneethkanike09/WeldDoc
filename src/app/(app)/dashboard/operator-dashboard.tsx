import { DonutCard, type Slice } from "@/components/app/dashboard-charts";
import { DashboardStat } from "@/components/app/dashboard-stat";
import { aggregateOperatorMasterCharts } from "@/lib/dashboard/aggregate-charts";
import {
  chartGridClass,
  kpiGridClass,
  sortByWidgetOrder,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { summarizeOperator, daysUntil } from "@/lib/operator-status";
import type { Operator, OperatorQualification } from "@/types/db";

export function OperatorDashboard({
  order,
  operators,
  oqs,
}: {
  order: DashboardWidgetId[];
  operators: Operator[];
  oqs: OperatorQualification[];
}) {
  const widgets = new Set(order);
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
  const masterCharts = aggregateOperatorMasterCharts(approved);

  const expiring = approved
    .map((o) => ({ days: daysUntil(o.expiry_date) }))
    .filter((e) => e.days !== null && e.days <= 60);

  const expiringSoon = expiring.filter(
    (e) => e.days !== null && e.days >= 0,
  ).length;
  const overdue = expiring.filter((e) => e.days !== null && e.days < 0).length;
  const activeQuals = approved.filter((o) => {
    const d = daysUntil(o.expiry_date);
    return d === null || d >= 0;
  }).length;

  const kpiEntries: { id: DashboardWidgetId; el: React.ReactNode }[] = [
    {
      id: "kpi_total_operators",
      el: (
        <DashboardStat
          key="kpi_total_operators"
          tone="brand"
          label="Total operators"
          value={operators.length}
          hint="Registered in your organisation"
          href="/operators"
        />
      ),
    },
    {
      id: "kpi_active_operator_qualifications",
      el: (
        <DashboardStat
          key="kpi_active_operator_qualifications"
          tone="active"
          label="Active qualifications"
          value={activeQuals}
          hint={`${approved.length} approved on record`}
        />
      ),
    },
    {
      id: "kpi_operator_expiring_soon",
      el: (
        <DashboardStat
          key="kpi_operator_expiring_soon"
          tone="warning"
          label="Expiring soon"
          value={expiringSoon}
          hint="Within the next 60 days"
        />
      ),
    },
    {
      id: "kpi_operator_overdue",
      el: (
        <DashboardStat
          key="kpi_operator_overdue"
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
      id: "chart_operator_status",
      el: (
        <DonutCard
          key="chart_operator_status"
          title="Operator status"
          data={statusSplit}
          useStatusColors
        />
      ),
    },
    {
      id: "chart_operator_qual_by_process",
      el: (
        <DonutCard
          key="chart_operator_qual_by_process"
          title="Qualifications by process"
          data={masterCharts.byProcess}
        />
      ),
    },
    {
      id: "chart_operator_qual_by_welding_type",
      el: (
        <DonutCard
          key="chart_operator_qual_by_welding_type"
          title="By welding type"
          data={masterCharts.byWeldingType}
        />
      ),
    },
    {
      id: "chart_operator_qual_by_product",
      el: (
        <DonutCard
          key="chart_operator_qual_by_product"
          title="By product type"
          data={masterCharts.byProduct}
        />
      ),
    },
    {
      id: "chart_operator_qual_by_joint",
      el: (
        <DonutCard
          key="chart_operator_qual_by_joint"
          title="By joint type"
          data={masterCharts.byJoint}
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
