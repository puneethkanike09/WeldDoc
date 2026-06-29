import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { OperatorForm } from "../../operator-form";
import { updateOperator } from "../../actions";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { Operator } from "@/types/db";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit operator" };

export default async function EditOperatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!operator) notFound();

  const action = updateOperator.bind(null, id);

  return (
    <>
      <PageHeader title="Edit operator" description={(operator as Operator).uid} />
      <div className="px-8 py-8">
        <Link
          href={`/operators/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <OperatorForm
          action={action}
          operator={operator as Operator}
          mode="edit"
          orgDefaults={{
            employer: org.name,
            branchLocation: org.location_code,
          }}
        />
      </div>
    </>
  );
}
