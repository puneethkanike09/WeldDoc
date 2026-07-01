import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { GroupParticipantsPanel } from "@/components/qualify/group-participants-panel";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { requireWelderWorkspace } from "@/lib/standards/active-standard.server";
import { nextAvailablePlantWelderId } from "@/lib/welders/plant-id";
import { createWelderGroupSession } from "../actions";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New group session" };

export default async function NewWelderGroupSessionPage() {
  await requireWelderWorkspace();
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welders } = await supabase
    .from("welders")
    .select("id, full_name, welder_id")
    .eq("org_id", org.id)
    .order("full_name");

  const suggestedPlantId = await nextAvailablePlantWelderId(
    supabase,
    org.id,
    org.welder_seq,
  );

  return (
    <>
      <PageHeader
        title="New group session"
        description="Select existing welders and/or register new welders for a shared ISO 9606-1 qualification."
      />
      <div className="px-8 py-8">
        <Link
          href="/welders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to welders
        </Link>
        <GroupParticipantsPanel
          action={createWelderGroupSession}
          kind="welder"
          people={(welders ?? []).map((w) => ({
            id: w.id,
            full_name: w.full_name,
            plant_id: w.welder_id,
          }))}
          orgDefaults={{
            employer: org.name,
            branchLocation: org.location_code,
            suggestedPlantId,
          }}
          backHref="/welders"
          listHref="/welders/qualify/group"
        />
      </div>
    </>
  );
}
