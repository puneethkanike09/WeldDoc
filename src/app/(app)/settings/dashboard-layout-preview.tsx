"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardStat } from "@/components/app/dashboard-stat";
import { DonutCard } from "@/components/app/dashboard-charts";
import {
  chartGridClass,
  widgetsForStandard,
  kpiGridClass,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import type { StandardSlug } from "@/lib/standards/catalog";
import { EyeOff } from "lucide-react";

const PREVIEW_STATUS = [
  { name: "Active", value: 72 },
  { name: "Expiring", value: 12 },
  { name: "Expired", value: 8 },
  { name: "None", value: 36 },
];

const PREVIEW_BY_PROCESS = [
  { name: "SMAW", value: 34 },
  { name: "GMAW", value: 28 },
  { name: "GTAW", value: 22 },
  { name: "FCAW", value: 10 },
];

const PREVIEW_BY_JOINT = [
  { name: "Butt weld", value: 68 },
  { name: "Fillet weld", value: 26 },
];

const PREVIEW_BY_WELDING_TYPE = [
  { name: "Fusion", value: 58 },
  { name: "Resistance", value: 36 },
];

const PREVIEW_WELDER_COVERAGE = [
  { process: "SMAW", bw: 12, fw: 8 },
  { process: "GMAW", bw: 9, fw: 5 },
  { process: "GTAW", bw: 6, fw: 0 },
];

const PREVIEW_OPERATOR_COVERAGE = [
  { process: "131", fusion: 10, resistance: 4 },
  { process: "135", fusion: 8, resistance: 2 },
  { process: "211", fusion: 5, resistance: 0 },
];

const PREVIEW_ATTENTION = [
  {
    name: "Alex Rivera",
    detail: "SMAW · 15 Jun 2026",
    badge: "12d",
    tone: "expiring" as const,
  },
  {
    name: "Jordan Lee",
    detail: "GMAW · 28 May 2026",
    badge: "4d",
    tone: "expiring" as const,
  },
  {
    name: "Sam Okonkwo",
    detail: "GTAW · 2 Jun 2026",
    badge: "2d overdue",
    tone: "expired" as const,
  },
];

function CoverageCell({ n }: { n: number }) {
  if (n === 0) {
    return <Badge tone="expired">0 — gap</Badge>;
  }
  return <span className="font-display font-semibold text-onyx">{n}</span>;
}

function PreviewWidget({
  id,
  label,
  enabled,
  onToggle,
  children,
  className,
}: {
  id: DashboardWidgetId;
  label: string;
  enabled: boolean;
  onToggle: (id: DashboardWidgetId) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={enabled}
      aria-label={`${enabled ? "Hide" : "Show"} ${label}`}
      title={enabled ? `Click to hide ${label}` : `Click to show ${label}`}
      onClick={() => onToggle(id)}
      className={cn(
        "group relative w-full rounded-(--radius-card) text-left transition-all",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-onyx",
        enabled
          ? "ring-0 hover:ring-2 hover:ring-onyx/10"
          : "opacity-50 saturate-50",
        className,
      )}
    >
      {!enabled ? (
        <span className="absolute inset-0 z-10 flex items-center justify-center rounded-(--radius-card) border-2 border-dashed border-steel/50 bg-panel/60 backdrop-blur-[1px]">
          <span className="flex items-center gap-1.5 rounded-full bg-frost px-3 py-1 text-xs font-medium text-steel">
            <EyeOff className="h-3.5 w-3.5" />
            Hidden
          </span>
        </span>
      ) : (
        <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-frost/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-steel opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          Hide
        </span>
      )}
      <div className="pointer-events-none select-none">{children}</div>
    </button>
  );
}

export function DashboardLayoutPreview({
  standard,
  enabled,
  onToggle,
}: {
  standard: StandardSlug;
  enabled: Set<DashboardWidgetId>;
  onToggle: (id: DashboardWidgetId) => void;
}) {
  const isOperator = standard === "iso-14732";
  const catalog = widgetsForStandard(standard);
  const widgetLabel = Object.fromEntries(
    catalog.map((w) => [w.id, w.label]),
  ) as Record<DashboardWidgetId, string>;

  const kpiIds = catalog
    .filter((w) => w.group === "KPI cards")
    .map((w) => w.id);
  const chartIds = catalog
    .filter((w) => w.group === "Charts")
    .map((w) => w.id);

  const kpiItems = kpiIds.map((id) => {
    const on = enabled.has(id);
    const widget = isOperator ? (
      <>
        {id === "kpi_total_operators" ? (
          <DashboardStat
            tone="brand"
            label="Total operators"
            value={48}
            hint="Registered in your organisation"
          />
        ) : null}
        {id === "kpi_active_operator_qualifications" ? (
          <DashboardStat
            tone="active"
            label="Active qualifications"
            value={36}
            hint="42 approved on record"
          />
        ) : null}
        {id === "kpi_operator_expiring_soon" ? (
          <DashboardStat
            tone="warning"
            label="Expiring soon"
            value={5}
            hint="Within the next 60 days"
          />
        ) : null}
        {id === "kpi_operator_overdue" ? (
          <DashboardStat
            tone="danger"
            label="Overdue"
            value={1}
            hint="Needs revalidation or continuity"
          />
        ) : null}
      </>
    ) : (
      <>
        {id === "kpi_total_welders" ? (
          <DashboardStat
            tone="brand"
            label="Total welders"
            value={128}
            hint="Registered in your organisation"
          />
        ) : null}
        {id === "kpi_active_qualifications" ? (
          <DashboardStat
            tone="active"
            label="Active qualifications"
            value={94}
            hint="102 approved on record"
          />
        ) : null}
        {id === "kpi_expiring_soon" ? (
          <DashboardStat
            tone="warning"
            label="Expiring soon"
            value={7}
            hint="Within the next 60 days"
          />
        ) : null}
        {id === "kpi_overdue" ? (
          <DashboardStat
            tone="danger"
            label="Overdue"
            value={2}
            hint="Needs revalidation or continuity"
          />
        ) : null}
      </>
    );

    return (
      <PreviewWidget
        key={id}
        id={id}
        label={widgetLabel[id]}
        enabled={on}
        onToggle={onToggle}
      >
        {widget}
      </PreviewWidget>
    );
  });

  const chartItems = chartIds.map((id) => {
    const on = enabled.has(id);
    const widget = isOperator ? (
      <>
        {id === "chart_operator_status" ? (
          <DonutCard
            title="Operator status"
            data={PREVIEW_STATUS}
            useStatusColors
          />
        ) : null}
        {id === "chart_operator_qual_by_process" ? (
          <DonutCard
            title="Qualifications by process"
            data={PREVIEW_BY_PROCESS}
          />
        ) : null}
        {id === "chart_operator_qual_by_welding_type" ? (
          <DonutCard
            title="By welding type"
            data={PREVIEW_BY_WELDING_TYPE}
          />
        ) : null}
      </>
    ) : (
      <>
        {id === "chart_welder_status" ? (
          <DonutCard
            title="Welder status"
            data={PREVIEW_STATUS}
            useStatusColors
          />
        ) : null}
        {id === "chart_qual_by_process" ? (
          <DonutCard
            title="Qualifications by process"
            data={PREVIEW_BY_PROCESS}
          />
        ) : null}
        {id === "chart_qual_by_joint" ? (
          <DonutCard title="By joint type" data={PREVIEW_BY_JOINT} />
        ) : null}
      </>
    );

    return (
      <PreviewWidget
        key={id}
        id={id}
        label={widgetLabel[id]}
        enabled={on}
        onToggle={onToggle}
      >
        {widget}
      </PreviewWidget>
    );
  });

  const coverageId = isOperator
    ? "section_operator_coverage"
    : "section_category_coverage";
  const attentionId = isOperator
    ? "section_operator_needs_attention"
    : "section_needs_attention";
  const showCoverage = enabled.has(coverageId);
  const showNeedsAttention = enabled.has(attentionId);
  const sectionGridClass =
    showCoverage && showNeedsAttention
      ? "grid gap-4 lg:grid-cols-[1.2fr_1fr]"
      : "grid gap-4 grid-cols-1";

  return (
    <div className="space-y-6 rounded-(--radius-card) border border-dashed border-silver/80 bg-parchment/40 p-4 sm:p-6">
      <div className={kpiGridClass(kpiIds.length)}>{kpiItems}</div>

      <div className={chartGridClass(chartIds.length)}>{chartItems}</div>

      <div className={sectionGridClass}>
        <PreviewWidget
          id={coverageId}
          label={widgetLabel[coverageId]}
          enabled={showCoverage}
          onToggle={onToggle}
        >
          <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Category coverage
            </h3>
            <p className="mt-1 text-sm text-graphite">
              {isOperator
                ? "Qualified operators per process and welding type. Zeros flag a gap."
                : "Qualified welders per process and joint type. Zeros flag a gap."}
            </p>
            <table className="mt-4 w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-silver text-[12px] uppercase tracking-wide text-steel">
                  <th className="py-2 font-medium">Process</th>
                  {isOperator ? (
                    <>
                      <th className="py-2 font-medium">Fusion</th>
                      <th className="py-2 font-medium">Resistance</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 font-medium">Butt weld</th>
                      <th className="py-2 font-medium">Fillet weld</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isOperator
                  ? PREVIEW_OPERATOR_COVERAGE.map((c) => (
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
                    ))
                  : PREVIEW_WELDER_COVERAGE.map((c) => (
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
          </div>
        </PreviewWidget>

        <PreviewWidget
          id={attentionId}
          label={widgetLabel[attentionId]}
          enabled={showNeedsAttention}
          onToggle={onToggle}
        >
          <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Needs attention
            </h3>
            <p className="mt-1 text-sm text-graphite">
              {isOperator
                ? "Operator qualifications expiring within 60 days or overdue."
                : "Qualifications expiring within 60 days or overdue."}
            </p>
            <div className="mt-4 space-y-2">
              {PREVIEW_ATTENTION.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-[10px] border border-silver px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-onyx">
                      {row.name}
                    </p>
                    <p className="text-xs text-steel">{row.detail}</p>
                  </div>
                  <Badge tone={row.tone}>{row.badge}</Badge>
                </div>
              ))}
            </div>
          </div>
        </PreviewWidget>
      </div>
    </div>
  );
}
