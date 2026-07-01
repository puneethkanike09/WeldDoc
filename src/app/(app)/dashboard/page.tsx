import { PageHeader } from "@/components/app/page-header";
import { AddWelderButton } from "@/components/app/add-welder-button";
import { AddOperatorButton } from "@/components/app/add-operator-button";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { dashboardWidgetSet } from "@/lib/dashboard/widgets";
import { getActiveStandardSlug } from "@/lib/standards/active-standard.server";
import type {
  Operator,
  OperatorQualification,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { OperatorDashboard } from "./operator-dashboard";
import { WelderDashboard } from "./welder-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { org, profile, email } = await requireSession();
  const supabase = await createClient();
  const standardSlug = await getActiveStandardSlug();
  const name = profile.full_name || email || "Engineer";
  const widgets = dashboardWidgetSet(org.dashboard_widgets, standardSlug);
  const isOperatorWorkspace = standardSlug === "iso-14732";

  if (isOperatorWorkspace) {
    const [{ data: operatorRows }, { data: oqRows }] = await Promise.all([
      supabase.from("operators").select("*").eq("org_id", org.id),
      supabase
        .from("operator_qualifications")
        .select("*")
        .eq("org_id", org.id),
    ]);

    return (
      <>
        <PageHeader title="Dashboard" description={`Welcome back, ${name}.`}>
          <AddOperatorButton />
        </PageHeader>
        <OperatorDashboard
          widgets={widgets}
          operators={(operatorRows ?? []) as Operator[]}
          oqs={(oqRows ?? []) as OperatorQualification[]}
        />
      </>
    );
  }

  const [{ data: welderRows }, { data: wpqRows }] = await Promise.all([
    supabase.from("welders").select("*").eq("org_id", org.id),
    supabase.from("qualification_records").select("*").eq("org_id", org.id),
  ]);

  const wpqs = (wpqRows ?? []) as QualificationRecord[];
  const { data: rangeRows } = await supabase
    .from("ranges_of_approval")
    .select("*")
    .in(
      "wpq_id",
      wpqs.length ? wpqs.map((w) => w.id) : ["00000000-0000-0000-0000-000000000000"],
    );
  const ranges = new Map(
    ((rangeRows ?? []) as RangeOfApproval[]).map((r) => [r.wpq_id, r]),
  );

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back, ${name}.`}>
        <AddWelderButton />
      </PageHeader>
      <WelderDashboard
        widgets={widgets}
        welders={(welderRows ?? []) as Welder[]}
        wpqs={wpqs}
        ranges={ranges}
      />
    </>
  );
}
