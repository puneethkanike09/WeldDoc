"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useAppTheme } from "@/components/app/app-theme-provider";

export interface Slice {
  name: string;
  value: number;
}

/** Muted categorical palette — avoids harsh brand red on large chart fills. */
const CHART_COLORS_LIGHT = [
  "#4d7ec4",
  "#64748b",
  "#4a9b8e",
  "#b8953d",
  "#7c6aad",
  "#6b9080",
  "#8aa4c7",
  "#94a3b8",
];

const CHART_COLORS_DARK = [
  "#7eb0e8",
  "#cbd5e1",
  "#6bc4b8",
  "#e4c97a",
  "#b8a6e0",
  "#8fbfaa",
  "#9ec5e8",
  "#d4d4d4",
];

const STATUS_COLORS_LIGHT: Record<string, string> = {
  Active: "#3d7a52",
  Expiring: "#c9a227",
  Expired: "#a65d52",
  Pending: "#64748b",
  None: "#909090",
  Inactive: "#cccccc",
  Suspended: "#b87070",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  Active: "#6bc48a",
  Expiring: "#e4c97a",
  Expired: "#d4918f",
  Pending: "#cbd5e1",
  None: "#737373",
  Inactive: "#525252",
  Suspended: "#dba0a0",
};

export function DonutCard({
  title,
  data,
  useStatusColors,
}: {
  title: string;
  data: Slice[];
  useStatusColors?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";
  const statusColors = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const tooltipFg = isDark ? "#ededed" : "#161616";
  const legendFg = isDark ? "#d4d4d4" : "#4a4a4a";

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-panel p-6">
      <h3 className="font-display text-base font-semibold tracking-tight text-onyx">
        {title}
      </h3>
      {total === 0 ? (
        <div className="grid h-[220px] place-items-center text-sm text-steel">
          No data yet
        </div>
      ) : (
        <div className="mt-2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      useStatusColors
                        ? statusColors[entry.name] ??
                          chartColors[i % chartColors.length]
                        : chartColors[i % chartColors.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: isDark ? "1px solid #2e2e2e" : "1px solid #e0e2e6",
                  backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                  color: tooltipFg,
                  fontSize: 13,
                  fontFamily: "var(--font-inter)",
                }}
                itemStyle={{ color: tooltipFg }}
                labelStyle={{ color: tooltipFg }}
              />
              <Legend
                iconType="circle"
                formatter={(value) => (
                  <span style={{ color: legendFg }}>{value}</span>
                )}
                wrapperStyle={{
                  fontSize: 12,
                  fontFamily: "var(--font-inter)",
                  color: legendFg,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
