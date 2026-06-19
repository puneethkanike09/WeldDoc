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

const CHART_COLORS = [
  "#f90a08",
  "#161616",
  "#d43c3b",
  "#f48789",
  "#686868",
  "#ffbbb4",
  "#de181a",
  "#9a9a9a",
];

const STATUS_COLORS_LIGHT: Record<string, string> = {
  Active: "#214224",
  Expiring: "#fcb42a",
  Expired: "#912e1f",
  Pending: "#161616",
  None: "#909090",
  Inactive: "#cccccc",
  Suspended: "#f90a08",
};

const STATUS_COLORS_DARK: Record<string, string> = {
  Active: "#5cb87a",
  Expiring: "#fcb42a",
  Expired: "#e07a6a",
  Pending: "#d4d4d4",
  None: "#737373",
  Inactive: "#525252",
  Suspended: "#f87171",
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
                        ? statusColors[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]
                        : CHART_COLORS[i % CHART_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: isDark ? "1px solid #2e2e2e" : "1px solid #e0e2e6",
                  backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                  color: isDark ? "#ededed" : "#161616",
                  fontSize: 13,
                  fontFamily: "var(--font-inter)",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  fontFamily: "var(--font-inter)",
                  color: isDark ? "#a3a3a3" : "#4a4a4a",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
