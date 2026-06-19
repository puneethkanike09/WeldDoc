"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export interface Slice {
  name: string;
  value: number;
}

const CHART_COLORS = [
  "#aa2d00",
  "#254fad",
  "#0a2e0e",
  "#fcab79",
  "#fcb42a",
  "#fa91e0",
  "#1b61c9",
  "#214224",
];

const STATUS_COLORS: Record<string, string> = {
  Active: "#214224",
  Expiring: "#fcb42a",
  Expired: "#912e1f",
  Pending: "#254fad",
  None: "#9297a0",
  Inactive: "#c9ccd1",
  Suspended: "#aa2d00",
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

  return (
    <div className="rounded-[var(--radius-card)] border border-silver bg-white p-6">
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
                  fontSize: 13,
                  fontFamily: "var(--font-inter)",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-inter)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
