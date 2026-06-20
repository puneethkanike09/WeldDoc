import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/app/pdf-preview";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import type { Welder } from "@/types/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("welders")
    .select("full_name")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();
  return { title: data ? `ID card — ${data.full_name}` : "ID card preview" };
}

export default async function WelderIdCardPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("full_name, uid")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!welder) notFound();
  const w = welder as Pick<Welder, "full_name" | "uid">;

  const previewSrc = `/api/welders/${id}/id-card`;
  const downloadSrc = `/api/welders/${id}/id-card?download=1`;

  return (
    <>
      <PageHeader
        title="Welder ID card"
        description={`${w.full_name} · ${w.uid}`}
      />
      <div className="px-8 py-8">
        <PdfPreview
          src={previewSrc}
          backHref={`/welders/${id}`}
          downloadHref={downloadSrc}
          title={`ID card — ${w.full_name}`}
        />
      </div>
    </>
  );
}
