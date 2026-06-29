import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { WelderForm } from "../welder-form";
import { createWelder } from "../actions";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextAvailablePlantWelderId } from "@/lib/welders/plant-id";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add welder" };

export default async function NewWelderPage() {
  const { org } = await requireSession();
  const supabase = await createClient();
  const suggestedPlantWelderId = await nextAvailablePlantWelderId(
    supabase,
    org.id,
    org.welder_seq,
  );

  return (
    <>
      <PageHeader
        title="Add welder"
        description="Create a permanent welder profile. System UID, plant welder ID, and QR code are issued automatically."
      />
      <div className="px-8 py-8">
        <Link
          href="/welders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to welders
        </Link>
        <WelderForm
          action={createWelder}
          mode="create"
          orgDefaults={{
            employer: org.name,
            branchLocation: org.location_code,
            suggestedPlantWelderId,
          }}
        />
      </div>
    </>
  );
}
