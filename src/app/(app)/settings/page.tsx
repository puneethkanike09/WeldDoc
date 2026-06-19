import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  updateOrgSettings,
  addSignatory,
  deleteSignatory,
} from "./actions";
import { OrgSettingsForm, SignatoryForm } from "./settings-forms";
import type { Signatory } from "@/types/db";
import { Trash2 } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: sigRows } = await supabase
    .from("signatories")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .order("role");
  const signatories = (sigRows ?? []) as Signatory[];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organisation details, alert recipients and certificate signatories."
      />
      <div className="space-y-8 px-8 py-8">
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

        <Card>
          <CardBody className="space-y-5">
            <CardTitle>Signatories</CardTitle>
            <p className="-mt-3 text-sm text-graphite">
              Signature &amp; stamp images are applied automatically to
              certificates and batch report sheets.
            </p>

            {signatories.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {signatories.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-[10px] border border-silver bg-frost/40 px-4 py-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-onyx">{s.name}</p>
                        <Badge
                          tone={
                            s.role === "manufacturer" ? "ember" : "sapphire"
                          }
                        >
                          {s.role === "manufacturer"
                            ? "Manufacturer"
                            : "Examining body"}
                        </Badge>
                      </div>
                      <p className="text-sm text-graphite">
                        {s.designation}
                        {s.organisation ? ` · ${s.organisation}` : ""}
                      </p>
                    </div>
                    <form action={deleteSignatory.bind(null, s.id)}>
                      <Button type="submit" variant="subtle" size="sm">
                        <Trash2 className="h-4 w-4 text-steel" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-silver pt-5">
              <SignatoryForm action={addSignatory} />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
