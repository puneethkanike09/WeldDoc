import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PageIntro } from "@/components/app/page-intro";
import { WelderForm } from "../../welder-form";
import { updateWelder } from "../../actions";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { Welder } from "@/types/db";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit welder" };

export default async function EditWelderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!welder) notFound();

  const action = updateWelder.bind(null, id);

  return (
    <>
      <PageHeader title="Edit welder" />
      <div className="px-8 py-8">
        <PageIntro className="mb-6">{(welder as Welder).uid}</PageIntro>
        <Link
          href={`/welders/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <div className="max-w-3xl">
          <WelderForm
            action={action}
            welder={welder as Welder}
            mode="edit"
          />
        </div>
      </div>
    </>
  );
}
