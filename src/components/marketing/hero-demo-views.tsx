"use client";

import { Eye, FileCheck2 } from "lucide-react";
import { DashboardStat } from "@/components/app/dashboard-stat";
import { PageHeader } from "@/components/app/page-header";
import { QualCountLights } from "@/components/app/qual-traffic-lights";
import type { DemoView } from "@/components/marketing/hero-demo-data";
import { HeroDemoEmailInboxView, HeroDemoEmailMessageView } from "@/components/marketing/hero-demo-email-view";
import { HeroDemoVerifyView } from "@/components/marketing/hero-demo-verify-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { STATUS_TONE } from "@/lib/welder-status";
import { cn } from "@/lib/utils";

const STEPS = ["Plan", "Test piece", "NDT / DT", "Certificate"];

function DashboardView() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back, Sarah." />
      <div className="page-content">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div data-demo-target="kpi-total">
            <DashboardStat tone="brand" label="Total welders" value={24} />
          </div>
          <DashboardStat tone="warning" label="Expiring soon" value={4} />
          <DashboardStat tone="danger" label="Overdue" value={2} />
        </div>
      </div>
    </div>
  );
}

function WeldersView({ highlight }: { highlight: string | null }) {
  const rows = [
    { name: "J. Morrison", id: "W#01", status: "Active" as const, counts: { current: 3, expiring: 0, expired: 0 } },
    { name: "Priya Nair", id: "W#02", status: "Expiring" as const, counts: { current: 1, expiring: 1, expired: 0 } },
  ];

  return (
    <div>
      <PageHeader title="Welder qualification" description="ISO 9606-1" />
      <div className="page-content">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-silver bg-panel">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-silver bg-frost text-[11px] uppercase tracking-wide text-steel">
                <th className="px-3 py-2.5 font-medium">Welder</th>
                <th className="px-3 py-2.5 font-medium">Quals</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-b border-silver/70 last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-onyx">{row.name}</p>
                    <p className="font-mono text-[11px] text-steel">{row.id}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <QualCountLights counts={row.counts} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      data-demo-target={index === 0 ? "view-row-0" : undefined}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-[10px] bg-inverse-bg px-2.5 py-1 text-[12px] font-medium text-inverse-fg",
                        index === 0 && highlight === "view-row-0" && "ring-2 ring-ember/70 ring-offset-2 ring-offset-panel",
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ highlight }: { highlight: string | null }) {
  return (
    <div>
      <PageHeader title="J. Morrison" description="W#01" />
      <div className="page-content">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="active">Approved</Badge>
                <p className="mt-2 font-display text-[15px] font-semibold text-onyx">
                  GMAW (135) · PF · Butt weld
                </p>
                <p className="mt-1 text-[13px] text-graphite">
                  Range 3–24 mm · valid until 14 Jun 2028
                </p>
              </div>
            </div>
            <span
              data-demo-target="qualify-btn"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[10px] bg-inverse-bg px-3 py-2 text-[13px] font-medium text-inverse-fg",
                highlight === "qualify-btn" && "ring-2 ring-ember/70 ring-offset-2 ring-offset-panel",
              )}
            >
              Qualify welder
            </span>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function QualifyView({ step }: { step: number }) {
  return (
    <div>
      <PageHeader title="Qualify welder" description="J. Morrison" />
      <div className="page-content space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <span
                key={label}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[12px] font-medium",
                  active && "bg-inverse-bg text-inverse-fg",
                  done && "bg-active/15 text-active-ink",
                  !active && !done && "bg-frost text-steel",
                )}
              >
                {n}. {label}
              </span>
            );
          })}
        </div>
        <Card>
          <CardBody className="space-y-3">
            {step === 1 && (
              <p className="text-[14px] text-charcoal">ISO 9606-1 · GMAW (135) · PF · butt weld</p>
            )}
            {step === 2 && (
              <p className="text-[14px] text-charcoal">Test piece: 12 mm plate · WPS-GMAW-135-001</p>
            )}
            {step === 3 && (
              <div className="flex gap-2">
                <Badge tone="active">RT — Accept</Badge>
                <Badge tone="active">Visual — Accept</Badge>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-2">
                <p className="text-[14px] text-charcoal">PF · BW · 3–24 mm · GMAW 135</p>
                <p className="flex items-center gap-2 text-[13px] text-active-ink">
                  <FileCheck2 className="h-4 w-4" />
                  Certificate PDF ready
                </p>
              </div>
            )}
            {step < 4 && (
              <span
                data-demo-target="qualify-continue"
                className="inline-flex rounded-[10px] bg-inverse-bg px-3 py-2 text-[13px] font-medium text-inverse-fg"
              >
                Continue
              </span>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function MasterlistView() {
  return (
    <div>
      <PageHeader title="Welder master list" description="Qualification register" />
      <div className="page-content">
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-silver bg-panel">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-silver bg-frost text-[11px] uppercase text-steel">
                <th className="px-3 py-2 text-left font-medium">Welder</th>
                <th className="px-3 py-2 text-left font-medium">Process</th>
                <th className="px-3 py-2 text-left font-medium">Valid until</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-silver/70">
                <td className="px-3 py-2 text-onyx">J. Morrison</td>
                <td className="px-3 py-2 text-charcoal">GMAW 135</td>
                <td className="px-3 py-2 text-charcoal">14 Jun 2028</td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-onyx">Priya Nair</td>
                <td className="px-3 py-2 text-charcoal">SMAW 111</td>
                <td className="px-3 py-2 text-charcoal">03 Sep 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function HeroDemoMain({
  view,
  qualifyStep,
  highlight,
  verifyRevealed,
}: {
  view: DemoView;
  qualifyStep: number;
  highlight: string | null;
  verifyRevealed: boolean;
}) {
  switch (view) {
    case "dashboard":
      return <DashboardView />;
    case "welders":
      return <WeldersView highlight={highlight} />;
    case "profile":
      return <ProfileView highlight={highlight} />;
    case "qualify":
      return <QualifyView step={qualifyStep} />;
    case "masterlist":
      return <MasterlistView />;
    case "verify":
      return <HeroDemoVerifyView revealed={verifyRevealed} />;
    case "email-inbox":
      return <HeroDemoEmailInboxView highlight={highlight} />;
    case "email-message":
      return <HeroDemoEmailMessageView />;
  }
}
