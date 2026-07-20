import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/billing/superadmin";
import { getOrgAccess } from "@/lib/billing/access";
import type { Organization } from "@/types/db";
import { AdminOrgTable, type AdminOrgRow } from "./admin-org-table";

export const metadata: Metadata = { title: "Superadmin" };

export default async function AdminPage() {
  await requireSuperAdmin();
  const supabase = createAdminClient();

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select(
      "id, name, plan_tier, subscription_status, trial_ends_at, current_period_end, billing_exempt, subscription_cancel_at_period_end, razorpay_subscription_id, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-sm text-red-700">
        Failed to load organisations: {error.message}
      </p>
    );
  }

  const rows: AdminOrgRow[] = (orgs ?? []).map((raw) => {
    const org = raw as Organization;
    const access = getOrgAccess(org);
    return {
      id: org.id,
      name: org.name,
      planTier: org.plan_tier,
      status: org.subscription_status,
      trialEndsAt: org.trial_ends_at,
      currentPeriodEnd: org.current_period_end,
      billingExempt: org.billing_exempt,
      cancelAtPeriodEnd: org.subscription_cancel_at_period_end,
      hasSubscription: Boolean(org.razorpay_subscription_id),
      canWrite: access.canWrite,
      createdAt: org.created_at,
    };
  });

  const stats = {
    total: rows.length,
    active: rows.filter((r) => r.status === "active").length,
    trialing: rows.filter((r) => r.status === "trialing").length,
    readOnly: rows.filter((r) => !r.canWrite).length,
    exempt: rows.filter((r) => r.billingExempt).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-onyx">
          Organisations
        </h1>
        <p className="mt-1 text-sm text-graphite">
          Manage subscriptions, trials, and billing exemptions across all
          tenants.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Trialing", value: stats.trialing },
          { label: "Read-only", value: stats.readOnly },
          { label: "Exempt", value: stats.exempt },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-card)] border border-silver bg-panel p-4"
          >
            <p className="text-xs text-graphite">{s.label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-onyx">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <AdminOrgTable rows={rows} />
    </div>
  );
}
