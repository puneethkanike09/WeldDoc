"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Slice } from "@/components/app/dashboard-charts";

const CHART_COLORS = [
  "#132537",
  "#e59527",
  "#2e4a63",
  "#2dc47a",
  "#6b7c8c",
  "#e85a30",
];

const STATUS_COLORS: Record<string, string> = {
  Active: "#2dc47a",
  Expiring: "#f0b820",
  Expired: "#e85a30",
  Pending: "#2e4a63",
  None: "#7d8896",
  Inactive: "#b0bec5",
  Suspended: "#e8794f",
};

export function HeroDonutCard({
  title,
  data,
  useStatusColors,
  compact,
}: {
  title: string;
  data: Slice[];
  useStatusColors?: boolean;
  compact?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const height = compact ? 160 : 220;
  const inner = compact ? 38 : 50;
  const outer = compact ? 62 : 80;

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-panel p-4 sm:p-6">
      <h3 className="font-display text-base font-semibold tracking-tight text-onyx">
        {title}
      </h3>
      {total === 0 ? (
        <div className="grid h-[160px] place-items-center text-sm text-steel">
          No data yet
        </div>
      ) : (
        <div className="mt-2" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={inner}
                outerRadius={outer}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      useStatusColors
                        ? STATUS_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]
                        : CHART_COLORS[i % CHART_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e0e2e6",
                  backgroundColor: "#ffffff",
                  color: "#132537",
                  fontSize: 13,
                }}
              />
              {!compact && (
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "#3c4a57" }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function HeroBarCard({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartHeight = Math.max(180, data.length * 32);

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-panel p-4 sm:p-6">
      <h3 className="font-display text-base font-semibold tracking-tight text-onyx">
        {title}
      </h3>
      {total === 0 ? (
        <div className="grid h-[180px] place-items-center text-sm text-steel">
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
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #e0d8ca",
                  backgroundColor: "#ffffff",
                  color: "#132537",
                  fontSize: 13,
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
