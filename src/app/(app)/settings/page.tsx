import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { updateOrgSettings } from "./actions";
import { OrgSettingsForm } from "./settings-forms";
import { SettingsAppearance } from "./settings-appearance";
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

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation details and appearance."
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
                    A daily job checks every approved welder and operator
                    qualification. When a certificate or 6-month continuity falls
                    within your lead days, a digest email is sent to the
                    recipients above. People with an email on their profile also
                    receive a personal reminder for their own qualifications.
                  </p>
                  <p className="text-sm font-medium text-graphite">
                    Welders (ISO 9606-1)
                  </p>
                  <ul className="space-y-1.5 text-sm text-graphite">
                    <li>· 9.3a — 3-year validity</li>
                    <li>· 9.3b — 2-year validity, renewable</li>
                    <li>· 9.3c — 6-month validity, renewable</li>
                  </ul>
                  <p className="text-sm font-medium text-graphite">
                    Operators (ISO 14732)
                  </p>
                  <ul className="space-y-1.5 text-sm text-graphite">
                    <li>· 6.3a — 6-year validity</li>
                    <li>· 6.3b — 3-year validity, renewable</li>
                    <li>· 6.3c — continuity only (no certificate expiry)</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
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
