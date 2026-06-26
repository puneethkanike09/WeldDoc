export const DASHBOARD_WIDGET_GROUPS = [
  "KPI cards",
  "Charts",
  "Sections",
] as const;

export type DashboardWidgetGroup = (typeof DASHBOARD_WIDGET_GROUPS)[number];

export const DASHBOARD_WIDGETS = [
  {
    id: "kpi_total_welders",
    label: "Total welders",
    description: "Registered in your organisation",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_active_qualifications",
    label: "Active qualifications",
    description: "Approved qualifications still in date",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_expiring_soon",
    label: "Expiring soon",
    description: "Within the next 60 days",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_overdue",
    label: "Overdue",
    description: "Needs revalidation or continuity",
    group: "KPI cards" as const,
  },
  {
    id: "chart_welder_status",
    label: "Welder status",
    description: "Donut chart by overall welder status",
    group: "Charts" as const,
  },
  {
    id: "chart_qual_by_process",
    label: "Qualifications by process",
    description: "Donut chart of approved qualifications",
    group: "Charts" as const,
  },
  {
    id: "chart_qual_by_joint",
    label: "By joint type",
    description: "Butt vs fillet weld split",
    group: "Charts" as const,
  },
  {
    id: "section_category_coverage",
    label: "Category coverage",
    description: "Process × joint type matrix",
    group: "Sections" as const,
  },
  {
    id: "section_needs_attention",
    label: "Needs attention",
    description: "Expiring or overdue qualifications",
    group: "Sections" as const,
  },
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];

export const ALL_DASHBOARD_WIDGET_IDS: DashboardWidgetId[] =
  DASHBOARD_WIDGETS.map((w) => w.id);

const WIDGET_ID_SET = new Set<string>(ALL_DASHBOARD_WIDGET_IDS);

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return WIDGET_ID_SET.has(value);
}

/** Parse stored org config; null/invalid → all widgets enabled. */
export function normalizeDashboardWidgets(
  raw: unknown,
): DashboardWidgetId[] {
  if (!Array.isArray(raw)) return [...ALL_DASHBOARD_WIDGET_IDS];
  const enabled = raw.filter(
    (v): v is DashboardWidgetId =>
      typeof v === "string" && isDashboardWidgetId(v),
  );
  return enabled.length > 0 ? enabled : [...ALL_DASHBOARD_WIDGET_IDS];
}

export function dashboardWidgetSet(raw: unknown): Set<DashboardWidgetId> {
  return new Set(normalizeDashboardWidgets(raw));
}

export function widgetsByGroup(group: DashboardWidgetGroup) {
  return DASHBOARD_WIDGETS.filter((w) => w.group === group);
}

export function kpiGridClass(count: number): string {
  if (count <= 1) return "grid gap-4 grid-cols-1";
  if (count === 2) return "grid gap-4 sm:grid-cols-2";
  if (count === 3) return "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";
}

export function chartGridClass(count: number): string {
  if (count <= 1) return "grid gap-4 grid-cols-1";
  if (count === 2) return "grid gap-4 sm:grid-cols-2";
  return "grid gap-4 lg:grid-cols-3";
}
