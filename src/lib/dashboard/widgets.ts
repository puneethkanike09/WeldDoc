import type { StandardSlug } from "@/lib/standards/catalog";

export const DASHBOARD_WIDGET_GROUPS = [
  "KPI cards",
  "Charts",
  "Sections",
] as const;

export type DashboardWidgetGroup = (typeof DASHBOARD_WIDGET_GROUPS)[number];

export const WELDER_DASHBOARD_WIDGETS = [
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

export const OPERATOR_DASHBOARD_WIDGETS = [
  {
    id: "kpi_total_operators",
    label: "Total operators",
    description: "Registered in your organisation",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_active_operator_qualifications",
    label: "Active qualifications",
    description: "Approved operator qualifications still in date",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_operator_expiring_soon",
    label: "Expiring soon",
    description: "Within the next 60 days",
    group: "KPI cards" as const,
  },
  {
    id: "kpi_operator_overdue",
    label: "Overdue",
    description: "Needs revalidation or continuity",
    group: "KPI cards" as const,
  },
  {
    id: "chart_operator_status",
    label: "Operator status",
    description: "Donut chart by overall operator status",
    group: "Charts" as const,
  },
  {
    id: "chart_operator_qual_by_process",
    label: "Qualifications by process",
    description: "Donut chart of approved operator qualifications",
    group: "Charts" as const,
  },
  {
    id: "chart_operator_qual_by_welding_type",
    label: "By welding type",
    description: "Fusion vs resistance split",
    group: "Charts" as const,
  },
  {
    id: "section_operator_coverage",
    label: "Category coverage",
    description: "Process × welding type matrix",
    group: "Sections" as const,
  },
  {
    id: "section_operator_needs_attention",
    label: "Needs attention",
    description: "Expiring or overdue operator qualifications",
    group: "Sections" as const,
  },
] as const;

export const DASHBOARD_WIDGETS = [
  ...WELDER_DASHBOARD_WIDGETS,
  ...OPERATOR_DASHBOARD_WIDGETS,
] as const;

export type WelderDashboardWidgetId =
  (typeof WELDER_DASHBOARD_WIDGETS)[number]["id"];
export type OperatorDashboardWidgetId =
  (typeof OPERATOR_DASHBOARD_WIDGETS)[number]["id"];
export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"];

export const ALL_WELDER_DASHBOARD_WIDGET_IDS: WelderDashboardWidgetId[] =
  WELDER_DASHBOARD_WIDGETS.map((w) => w.id);

export const ALL_OPERATOR_DASHBOARD_WIDGET_IDS: OperatorDashboardWidgetId[] =
  OPERATOR_DASHBOARD_WIDGETS.map((w) => w.id);

export const ALL_DASHBOARD_WIDGET_IDS: DashboardWidgetId[] =
  DASHBOARD_WIDGETS.map((w) => w.id);

const WIDGET_ID_SET = new Set<string>(ALL_DASHBOARD_WIDGET_IDS);

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return WIDGET_ID_SET.has(value);
}

export function standardUsesOperatorWidgets(slug: StandardSlug): boolean {
  return slug === "iso-14732";
}

export function widgetsForStandard(slug: StandardSlug) {
  return standardUsesOperatorWidgets(slug)
    ? OPERATOR_DASHBOARD_WIDGETS
    : WELDER_DASHBOARD_WIDGETS;
}

export function allWidgetIdsForStandard(
  slug: StandardSlug,
): DashboardWidgetId[] {
  return widgetsForStandard(slug).map((w) => w.id);
}

export const DEFAULT_DASHBOARD_WIDGETS_BY_STANDARD: Record<
  StandardSlug,
  DashboardWidgetId[]
> = {
  "iso9606-1": [...ALL_WELDER_DASHBOARD_WIDGET_IDS],
  "asme-ix": [...ALL_WELDER_DASHBOARD_WIDGET_IDS],
  "aws-d1-1": [...ALL_WELDER_DASHBOARD_WIDGET_IDS],
  "iso-14732": [...ALL_OPERATOR_DASHBOARD_WIDGET_IDS],
};

export type DashboardWidgetsConfig =
  | DashboardWidgetId[]
  | Partial<Record<StandardSlug, DashboardWidgetId[]>>;

/** Legacy array → iso9606-1 layout; object keyed by standard slug. */
export function parseDashboardWidgetsConfig(
  raw: unknown,
): Partial<Record<StandardSlug, DashboardWidgetId[]>> {
  if (Array.isArray(raw)) {
    const enabled = raw.filter(
      (v): v is DashboardWidgetId =>
        typeof v === "string" && isDashboardWidgetId(v),
    );
    if (enabled.length === 0) return {};
    return { "iso9606-1": enabled };
  }

  if (!raw || typeof raw !== "object") return {};

  const out: Partial<Record<StandardSlug, DashboardWidgetId[]>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const enabled = value.filter(
      (v): v is DashboardWidgetId =>
        typeof v === "string" && isDashboardWidgetId(v),
    );
    if (enabled.length > 0) {
      out[key as StandardSlug] = enabled;
    }
  }
  return out;
}

/** Parse stored org config for a workspace; null/invalid → all widgets for that standard. */
export function normalizeDashboardWidgets(
  raw: unknown,
  slug: StandardSlug,
): DashboardWidgetId[] {
  const allowed = new Set(allWidgetIdsForStandard(slug));
  const defaults = DEFAULT_DASHBOARD_WIDGETS_BY_STANDARD[slug];
  const config = parseDashboardWidgetsConfig(raw);
  const stored = config[slug];

  if (!stored) return [...defaults];

  const enabled = stored.filter((id) => allowed.has(id));
  return enabled.length > 0 ? enabled : [...defaults];
}

export function dashboardWidgetSet(
  raw: unknown,
  slug: StandardSlug,
): Set<DashboardWidgetId> {
  return new Set(normalizeDashboardWidgets(raw, slug));
}

export function mergeDashboardWidgetsConfig(
  raw: unknown,
  slug: StandardSlug,
  enabled: DashboardWidgetId[],
): Partial<Record<StandardSlug, DashboardWidgetId[]>> {
  return {
    ...parseDashboardWidgetsConfig(raw),
    [slug]: enabled,
  };
}

export function widgetsByGroup(
  group: DashboardWidgetGroup,
  slug: StandardSlug,
) {
  return widgetsForStandard(slug).filter((w) => w.group === group);
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
