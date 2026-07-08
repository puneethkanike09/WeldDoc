import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { orderedDashboardWidgets } from "@/lib/dashboard/widgets";
import { activeQualifications } from "@/lib/qualification-active";
import { updateDashboardWidgets } from "@/app/(app)/settings/actions";
import type {
  Operator,
  OperatorQualification,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";
import { CustomizeDashboardButton } from "./customize-dashboard";
import { OperatorDashboard } from "./operator-dashboard";
import { WelderDashboard } from "./welder-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { org, profile, email } = await requireSession();
  const supabase = await createClient();
  const name = profile.full_name || email || "Engineer";
  const welderOrder = orderedDashboardWidgets(org.dashboard_widgets, "iso9606-1");
  const operatorOrder = orderedDashboardWidgets(
    org.dashboard_widgets,
    "iso-14732",
  );

  const [
    { data: welderRows },
    { data: wpqRows },
    { data: operatorRows },
    { data: oqRows },
  ] = await Promise.all([
    supabase.from("welders").select("*").eq("org_id", org.id),
    supabase.from("qualification_records").select("*").eq("org_id", org.id),
    supabase.from("operators").select("*").eq("org_id", org.id),
    supabase.from("operator_qualifications").select("*").eq("org_id", org.id),
  ]);

  const allWpqs = (wpqRows ?? []) as QualificationRecord[];
  const wpqs = activeQualifications(allWpqs);
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
        <CustomizeDashboardButton
          action={updateDashboardWidgets}
          initialWelder={welderOrder}
          initialOperator={operatorOrder}
        />
      </PageHeader>

      <div className="pb-8">
        <WelderDashboard
          order={welderOrder}
          welders={(welderRows ?? []) as Welder[]}
          wpqs={allWpqs}
          ranges={ranges}
        />
        <OperatorDashboard
          order={operatorOrder}
          operators={(operatorRows ?? []) as Operator[]}
          oqs={(oqRows ?? []) as OperatorQualification[]}
        />
      </div>
    </>
  );
}
