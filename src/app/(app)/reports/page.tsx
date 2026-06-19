import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import type { QualificationTestReport } from "@/types/db";
import { FilePlus2, FileStack } from "lucide-react";

export const metadata: Metadata = { title: "Test reports" };

export default async function ReportsPage() {
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("qualification_test_reports")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  // Count welders per report.
  const { data: counts } = await supabase
    .from("qualification_records")
    .select("report_id")
    .eq("org_id", org.id)
    .not("report_id", "is", null);
  const countMap = new Map<string, number>();
  for (const c of counts ?? []) {
    const rid = (c as { report_id: string }).report_id;
    countMap.set(rid, (countMap.get(rid) ?? 0) + 1);
  }

  const rows = (reports ?? []) as QualificationTestReport[];

  return (
    <>
      <PageHeader
        title="Test reports"
        description="Batch 'Welder Qualification Details' reports as per EN ISO 9606-1."
      >
        <ButtonLink href="/reports/new">
          <FilePlus2 className="h-4 w-4" /> New report
        </ButtonLink>
      </PageHeader>

      <div className="px-8 py-8">
        {rows.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-silver bg-white px-6 py-16 text-center">
            <FileStack className="mx-auto h-8 w-8 text-steel" />
            <h3 className="mt-3 font-display text-lg font-semibold text-onyx">
              No test reports yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-graphite">
              Create a batch qualification report to test several welders in one
              session and generate the BW / FW sheet.
            </p>
            <div className="mt-6 flex justify-center">
              <ButtonLink href="/reports/new">
                <FilePlus2 className="h-4 w-4" /> New report
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <Card className="transition-shadow hover:shadow-[var(--shadow-card)]">
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] text-charcoal">
                        {r.report_number}
                      </span>
                      <Badge tone={r.joint_category === "BW" ? "ember" : "sapphire"}>
                        {r.joint_category === "BW" ? "Butt weld" : "Fillet weld"}
                      </Badge>
                    </div>
                    <p className="mt-3 font-display text-base font-semibold text-onyx">
                      {countMap.get(r.id) ?? 0} welder(s)
                    </p>
                    <p className="mt-1 text-sm text-graphite">
                      {formatDate(r.test_date)}
                      {r.wps_no ? ` · ${r.wps_no}` : ""}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
