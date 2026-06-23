import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { updateOrgSettings } from "./actions";
import { OrgSettingsForm } from "./settings-forms";
import { SettingsAppearance } from "./settings-appearance";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { org } = await requireSession();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation details and expiry alert recipients."
      />
      <div className="space-y-8 px-8 py-8">
        <Card className="h-fit">
          <CardBody className="space-y-4">
            <CardTitle>Appearance</CardTitle>
            <SettingsAppearance />
          </CardBody>
        </Card>

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
                certificate or 6-month continuity falls within your lead days,
                a digest email is sent to the recipients above.
              </p>
              <ul className="space-y-1.5 text-sm text-graphite">
                <li>· 9.3a — 3-year validity</li>
                <li>· 9.3b — 2-year validity, renewable</li>
                <li>· 9.3c — 6-month validity, renewable</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
