"use client";

import {
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from "recharts";
import { useAppTheme } from "@/components/app/app-theme-provider";

export interface Slice {
  name: string;
  value: number;
}

/** Brand categorical palette — navy #132537, orange #e59527, steel supporting hues. */
const CHART_COLORS_LIGHT = [
  "#132537",
  "#e59527",
  "#2e4a63",
  "#2dc47a",
  "#6b7c8c",
  "#e85a30",
  "#3a5f80",
  "#b0bec5",
];

const CHART_COLORS_DARK = [
  "#7fa8cf",
  "#e59527",
  "#5b7d9c",
  "#6ee7a8",
  "#9aa8b6",
  "#f0895f",
  "#a9c3db",
  "#cdd5dd",
];

const STATUS_COLORS_LIGHT: Record<string, string> = {
  Active: "#2dc47a",
  Expiring: "#f0b820",
  Expired: "#e85a30",
  Pending: "#2e4a63",
  None: "#7d8896",
  Inactive: "#b0bec5",
  Suspended: "#e8794f",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  Active: "#6ee7a8",
  Expiring: "#f7cf6b",
  Expired: "#f0895f",
  Pending: "#7fa8cf",
  None: "#7d8896",
  Inactive: "#8896a4",
  Suspended: "#f6b39b",
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
  const tooltipFg = isDark ? "#eef1f4" : "#132537";
  const legendFg = isDark ? "#aab8c6" : "#3c4a57";

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

function chartTooltipStyle(isDark: boolean) {
  const tooltipFg = isDark ? "#eef1f4" : "#132537";
  return {
    contentStyle: {
      borderRadius: 10,
      border: isDark ? "1px solid #2e4a63" : "1px solid #e0d8ca",
      backgroundColor: isDark ? "#132537" : "#ffffff",
      color: tooltipFg,
      fontSize: 13,
      fontFamily: "var(--font-inter)",
    },
    itemStyle: { color: tooltipFg },
    labelStyle: { color: tooltipFg },
  } as const;
}

export function BarCard({
  title,
  data,
}: {
  title: string;
  data: Slice[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";
  const chartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const axisFg = isDark ? "#a3a3a3" : "#64748b";
  const tooltip = chartTooltipStyle(isDark);
  const chartHeight = Math.max(220, data.length * 36);

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
        <div className="mt-2" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <XAxis type="number" allowDecimals={false} tick={{ fill: axisFg, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fill: axisFg, fontSize: 11 }}
              />
              <Tooltip {...tooltip} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={chartColors[i % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
