import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { GroupParticipantsPanel } from "@/components/qualify/group-participants-panel";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireOperatorWorkspace } from "@/lib/standards/active-standard.server";
import { nextAvailablePlantOperatorId } from "@/lib/operators/plant-id";
import { createOperatorGroupSession } from "../actions";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New group session" };

export default async function NewOperatorGroupSessionPage() {
  await requireOperatorWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: operators } = await supabase
    .from("operators")
    .select("id, full_name, operator_id")
    .eq("org_id", org.id)
    .order("full_name");

  const suggestedPlantId = await nextAvailablePlantOperatorId(
    supabase,
    org.id,
    org.operator_seq,
  );

  return (
    <>
      <PageHeader
        title="New group session"
        description="Select existing operators and/or register new operators for a shared ISO 14732 qualification."
      />
      <div className="px-8 py-8">
        <Link
          href="/operators"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to operators
        </Link>
        <GroupParticipantsPanel
          action={createOperatorGroupSession}
          kind="operator"
          people={(operators ?? []).map((o) => ({
            id: o.id,
            full_name: o.full_name,
            plant_id: o.operator_id,
          }))}
          orgDefaults={{
            employer: org.name,
            branchLocation: org.location_code,
            suggestedPlantId,
          }}
          backHref="/operators"
          listHref="/operators/qualify/group"
        />
      </div>
    </>
  );
}
