import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { getActiveStandardSlug } from "@/lib/standards/active-standard.server";
import { updateOrgSettings, updateDashboardWidgets } from "./actions";
import { OrgSettingsForm } from "./settings-forms";
import { SettingsAppearance } from "./settings-appearance";
import { DashboardWidgetsForm } from "./dashboard-widgets-form";
import {
  SettingsTabs,
} from "./settings-tabs";
import { parseSettingsTab } from "./settings-tab-ids";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { org } = await requireSession();
  const { tab } = await searchParams;
  const activeStandard = await getActiveStandardSlug();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation details, dashboard layout, and appearance."
      />
      <div className="px-8 py-8">
        <SettingsTabs
          initialTab={parseSettingsTab(tab)}
          organisation={
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardBody className="space-y-5">
                  <CardTitle>Organisation &amp; alerts</CardTitle>
                  <OrgSettingsForm org={org} action={updateOrgSettings} />
                </CardBody>
              </Card>

              <Card className="h-fit">
                <CardBody className="space-y-3">
                  <CardTitle>How expiry alerts work</CardTitle>
                  <p className="text-sm text-graphite">
                    A daily job checks every approved qualification. When a
                    certificate or 6-month continuity falls within your lead
                    days, a digest email is sent to the recipients above. Welders
                    with an email on their profile also receive a personal
                    reminder for their own qualifications.
                  </p>
                  <ul className="space-y-1.5 text-sm text-graphite">
                    <li>· 9.3a — 3-year validity</li>
                    <li>· 9.3b — 2-year validity, renewable</li>
                    <li>· 9.3c — 6-month validity, renewable</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          }
          dashboard={
            <Card className="h-fit">
              <CardBody className="space-y-4">
                <CardTitle>Dashboard layout</CardTitle>
                <DashboardWidgetsForm
                  org={org}
                  action={updateDashboardWidgets}
                  initialStandard={activeStandard}
                />
              </CardBody>
            </Card>
          }
          appearance={
            <Card className="h-fit max-w-3xl">
              <CardBody className="space-y-4">
                <CardTitle>Appearance</CardTitle>
                <SettingsAppearance />
              </CardBody>
            </Card>
          }
        />
      </div>
    </>
  );
}
