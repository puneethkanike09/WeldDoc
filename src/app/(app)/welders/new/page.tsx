import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PageIntro } from "@/components/app/page-intro";
import { WelderForm } from "../welder-form";
import { createWelder } from "../actions";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add welder" };

export default function NewWelderPage() {
  return (
    <>
      <PageHeader title="Add welder" />
      <div className="px-8 py-8">
        <PageIntro className="mb-6">
          Create a permanent welder profile. A UID and QR code are issued
          automatically.
        </PageIntro>
        <Link
          href="/welders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to welders
        </Link>
        <div className="max-w-3xl">
          <WelderForm action={createWelder} mode="create" />
        </div>
      </div>
    </>
  );
}
