import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { WelderForm } from "../welder-form";
import { createWelder } from "../actions";
import { requireSession } from "@/lib/auth";
import { suggestPlantWelderId } from "@/lib/welders/plant-id";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add welder" };

export default async function NewWelderPage() {
  const { org } = await requireSession();

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
        <div className="max-w-3xl">
          <WelderForm
            action={createWelder}
            mode="create"
            orgDefaults={{
              employer: org.name,
              branchLocation: org.location_code,
              suggestedPlantWelderId: suggestPlantWelderId(org.welder_seq),
            }}
          />
        </div>
      </div>
    </>
  );
}
