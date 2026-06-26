"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DashboardStat } from "@/components/app/dashboard-stat";
import { DonutCard } from "@/components/app/dashboard-charts";
import {
  chartGridClass,
  DASHBOARD_WIDGETS,
  kpiGridClass,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { EyeOff } from "lucide-react";

const WIDGET_LABEL = Object.fromEntries(
  DASHBOARD_WIDGETS.map((w) => [w.id, w.label]),
) as Record<DashboardWidgetId, string>;

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

const PREVIEW_COVERAGE = [
  { process: "SMAW", bw: 12, fw: 8 },
  { process: "GMAW", bw: 9, fw: 5 },
  { process: "GTAW", bw: 6, fw: 0 },
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
  enabled,
  onToggle,
  children,
  className,
}: {
  id: DashboardWidgetId;
  enabled: boolean;
  onToggle: (id: DashboardWidgetId) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const label = WIDGET_LABEL[id];

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
  enabled,
  onToggle,
}: {
  enabled: Set<DashboardWidgetId>;
  onToggle: (id: DashboardWidgetId) => void;
}) {
  const kpiIds = [
    "kpi_total_welders",
    "kpi_active_qualifications",
    "kpi_expiring_soon",
    "kpi_overdue",
  ] as const satisfies readonly DashboardWidgetId[];

  const chartIds = [
    "chart_welder_status",
    "chart_qual_by_process",
    "chart_qual_by_joint",
  ] as const satisfies readonly DashboardWidgetId[];

  const kpiItems = kpiIds.map((id) => {
    const on = enabled.has(id);
    const widget = (
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
      <PreviewWidget key={id} id={id} enabled={on} onToggle={onToggle}>
        {widget}
      </PreviewWidget>
    );
  });

  const chartItems = chartIds.map((id) => {
    const on = enabled.has(id);
    const widget = (
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
      <PreviewWidget key={id} id={id} enabled={on} onToggle={onToggle}>
        {widget}
      </PreviewWidget>
    );
  });

  const showCoverage = enabled.has("section_category_coverage");
  const showNeedsAttention = enabled.has("section_needs_attention");
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
          id="section_category_coverage"
          enabled={showCoverage}
          onToggle={onToggle}
        >
          <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Category coverage
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Qualified welders per process and joint type. Zeros flag a gap.
            </p>
            <table className="mt-4 w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-silver text-[12px] uppercase tracking-wide text-steel">
                  <th className="py-2 font-medium">Process</th>
                  <th className="py-2 font-medium">Butt weld</th>
                  <th className="py-2 font-medium">Fillet weld</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_COVERAGE.map((c) => (
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
          id="section_needs_attention"
          enabled={showNeedsAttention}
          onToggle={onToggle}
        >
          <div className="rounded-(--radius-card) border border-silver bg-panel p-6">
            <h3 className="font-display text-base font-semibold text-onyx">
              Needs attention
            </h3>
            <p className="mt-1 text-sm text-graphite">
              Qualifications expiring within 60 days or overdue.
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
