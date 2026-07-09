import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { OperatorForm } from "../operator-form";
import { createOperator } from "../actions";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextAvailablePlantOperatorId } from "@/lib/operators/plant-id";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add operator" };

export default async function NewOperatorPage() {
  const { org } = await requireSession();
  const supabase = await createClient();
  const suggestedPlantOperatorId = await nextAvailablePlantOperatorId(
    supabase,
    org.id,
    org.operator_seq,
  );

  return (
    <>
      <PageHeader
        title="Add operator"
        description="Create a permanent operator profile. Plant operator ID and QR code are issued automatically."
      />
      <div className="page-content">
        <Link
          href="/operators"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to operators
        </Link>
        <OperatorForm
          action={createOperator}
          mode="create"
          orgDefaults={{
            employer: org.name,
            branchLocation: org.location_code,
            suggestedPlantOperatorId,
          }}
        />
      </div>
    </>
  );
}
