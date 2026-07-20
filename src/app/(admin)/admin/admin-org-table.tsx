"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlanTier, SubscriptionStatus } from "@/types/db";
import {
  extendTrial,
  forceCancelSubscription,
  overridePlan,
  setBillingExempt,
} from "./actions";

export interface AdminOrgRow {
  id: string;
  name: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  billingExempt: boolean;
  cancelAtPeriodEnd: boolean;
  hasSubscription: boolean;
  canWrite: boolean;
  createdAt: string;
}

const TIERS: PlanTier[] = ["starter", "growth", "enterprise"];
const STATUSES: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "halted",
  "cancelled",
  "expired",
];

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function AdminOrgTable({ rows }: { rows: AdminOrgRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? rows.filter((r) =>
        r.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : rows;

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search organisations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full max-w-sm rounded-button border border-silver bg-panel px-3 text-sm text-onyx outline-none focus:border-onyx"
      />
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-silver">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-silver bg-frost text-left text-xs uppercase text-graphite">
              <th className="px-4 py-3">Organisation</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trial / Renews</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <AdminRow key={row.id} row={row} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                  No organisations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRow({ row }: { row: AdminOrgRow }) {
  const [pending, startTransition] = useTransition();
  const [tier, setTier] = useState<PlanTier>(row.planTier);
  const [status, setStatus] = useState<SubscriptionStatus>(row.status);
  const [trialDays, setTrialDays] = useState("30");

  const run = (fn: () => Promise<void>, ok: string) => {
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed.");
      }
    });
  };

  return (
    <tr className="border-b border-silver/60 align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-onyx">{row.name}</p>
        <p className="text-xs text-graphite">
          Joined {fmt(row.createdAt)}
        </p>
      </td>
      <td className="px-4 py-3 capitalize text-charcoal">{row.planTier}</td>
      <td className="px-4 py-3">
        <span className="capitalize text-charcoal">
          {row.status.replace("_", " ")}
        </span>
        {row.cancelAtPeriodEnd && (
          <span className="ml-1 text-xs text-amber-700">(ending)</span>
        )}
      </td>
      <td className="px-4 py-3 text-charcoal">
        {row.status === "trialing"
          ? fmt(row.trialEndsAt)
          : fmt(row.currentPeriodEnd)}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            row.canWrite
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-800",
          )}
        >
          {row.canWrite ? "Full" : "Read-only"}
        </span>
        {row.billingExempt && (
          <span className="ml-1 rounded-full bg-frost px-2 py-0.5 text-xs text-charcoal">
            Exempt
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setBillingExempt(row.id, !row.billingExempt),
                row.billingExempt ? "Exemption removed." : "Org exempted.",
              )
            }
          >
            {row.billingExempt ? "Remove exempt" : "Make exempt"}
          </Button>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              className="h-8 w-16 rounded-[8px] border border-silver bg-panel px-2 text-xs text-onyx outline-none focus:border-onyx"
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(
                  () => extendTrial(row.id, Number(trialDays)),
                  "Trial extended.",
                )
              }
            >
              Set trial
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as PlanTier)}
              className="h-8 rounded-[8px] border border-silver bg-panel px-1.5 text-xs text-onyx outline-none focus:border-onyx"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              className="h-8 rounded-[8px] border border-silver bg-panel px-1.5 text-xs text-onyx outline-none focus:border-onyx"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(
                  () => overridePlan(row.id, tier, status),
                  "Plan overridden.",
                )
              }
            >
              Apply
            </Button>
          </div>

          {row.hasSubscription && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Cancel this org's subscription now?")) return;
                run(
                  () => forceCancelSubscription(row.id),
                  "Subscription cancelled.",
                );
              }}
            >
              Cancel subscription
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
