"use client";

import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export type CompareRow = {
  label: string;
  others: boolean | string;
};

function othersScore(others: boolean | string): number {
  if (others === true) return 5;
  if (others === false) return 1;
  return 3;
}

/** Short axis labels so the radar stays readable. */
const AXIS_LABELS: Record<string, string[]> = {
  "Purpose-built for welding qualifications": ["Purpose-built", "for welding"],
  "Standards-based range of approval": ["Standards-based", "range"],
  "Auto range-of-approval engine": ["Auto RoA", "engine"],
  "Instant QR on-site verification": ["Instant QR", "verification"],
  "Group qualification sessions": ["Group", "sessions"],
  "Built for the Indian market & price": ["India market", "& price"],
  "Onboard in an afternoon": ["Onboard in", "an afternoon"],
};

type CompareRadarProps = {
  rows: CompareRow[];
};

export function CompareRadar({ rows }: CompareRadarProps) {
  const radarData = {
    labels: rows.map((r) => AXIS_LABELS[r.label] ?? r.label),
    datasets: [
      {
        label: "Weld.Doc",
        data: rows.map(() => 5),
        backgroundColor: "rgba(19, 37, 55, 0.15)",
        borderColor: "#132537",
        pointBackgroundColor: "#132537",
        borderWidth: 2,
      },
      {
        label: "Others",
        data: rows.map((r) => othersScore(r.others)),
        backgroundColor: "rgba(150, 150, 150, 0.08)",
        borderColor: "#a3a29c",
        pointBackgroundColor: "#a3a29c",
        borderWidth: 2,
      },
    ],
  };

  return (
    <section id="compare" className="section-y bg-canvas">
      <div className="mx-auto max-w-[1040px] px-6">
        <div className="max-w-[640px]">
          <p className="text-mono-label text-brand-red">Why Weld.Doc</p>
          <h2 className="text-section-heading mt-4">Focused beats bloated</h2>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="relative mx-auto aspect-square w-full max-w-[440px]">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    min: 0,
                    max: 5,
                    ticks: { display: false },
                    pointLabels: {
                      font: { size: 11, family: "inherit" },
                      color: "#5c5b57",
                    },
                    grid: { color: "#e1e0d9" },
                    angleLines: { color: "#e1e0d9" },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title(items) {
                        const idx = items[0]?.dataIndex ?? 0;
                        return rows[idx]?.label ?? "";
                      },
                    },
                  },
                },
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-deep-green" />
              <span className="text-caption text-ink">Weld.Doc</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted-slate" />
              <span className="text-caption text-slate">Others</span>
            </div>
            <p className="text-body mt-4 text-slate">
              Across every capability that matters to fabrication and QC teams,
              Weld.Doc covers the full shape. Broad ERPs leave gaps where
              welding-specific workflows get treated as an afterthought.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
