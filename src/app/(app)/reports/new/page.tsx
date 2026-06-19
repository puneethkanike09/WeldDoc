import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { ReportBuilder } from "../report-builder";
import { createReport } from "../actions";
import type { Signatory, Welder } from "@/types/db";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New test report" };

export default async function NewReportPage() {
  const { org } = await requireSession();
  const supabase = await createClient();

  const [{ data: welders }, { data: sigs }] = await Promise.all([
    supabase
      .from("welders")
      .select("id, full_name, welder_id, is_new_welder")
      .eq("org_id", org.id)
      .order("full_name"),
    supabase
      .from("signatories")
      .select("*")
      .eq("org_id", org.id)
      .eq("is_active", true),
  ]);

  return (
    <>
      <PageHeader
        title="New qualification test report"
        description="Group multiple welders into one batch test session. A sequential report number is assigned automatically."
      />
      <div className="px-8 py-8">
        <Link
          href="/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
        <div className="max-w-5xl">
          {(welders ?? []).length === 0 ? (
            <p className="rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
              Add welders first, then create a batch test report.
            </p>
          ) : (
            <ReportBuilder
              action={createReport}
              welders={(welders ?? []) as Pick<
                Welder,
                "id" | "full_name" | "welder_id" | "is_new_welder"
              >[]}
              signatories={(sigs ?? []) as Signatory[]}
            />
          )}
        </div>
      </div>
    </>
  );
}
