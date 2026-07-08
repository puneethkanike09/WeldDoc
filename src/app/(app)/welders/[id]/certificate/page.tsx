import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/app/pdf-preview";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { qualificationProcessLabel } from "@/lib/iso9606/constants";
import type { QualificationRecord, Welder } from "@/types/db";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wpq?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { wpq: wpqId } = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: welder } = await supabase
    .from("welders")
    .select("full_name")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!welder || !wpqId) {
    return { title: "Certificate preview" };
  }

  const { data: wpq } = await supabase
    .from("qualification_records")
    .select("process, process_2, joint_type")
    .eq("id", wpqId)
    .eq("welder_id", id)
    .eq("org_id", org.id)
    .single();

  const q = wpq as Pick<QualificationRecord, "process" | "process_2" | "joint_type"> | null;
  const qual = q
    ? `${qualificationProcessLabel(q.process, q.process_2)} · ${q.joint_type === "BW" ? "Butt" : "Fillet"}`
    : "Qualification";

  return {
    title: `Certificate — ${welder.full_name} (${qual})`,
  };
}

export default async function WelderCertificatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wpq?: string }>;
}) {
  const { id } = await params;
  const { wpq: wpqId } = await searchParams;
  if (!wpqId) notFound();

  const { org } = await requireSession();
  const supabase = await createClient();

  const [{ data: welder }, { data: wpq }] = await Promise.all([
    supabase
      .from("welders")
      .select("full_name, welder_id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single(),
    supabase
      .from("qualification_records")
      .select("id, process, process_2, joint_type, wpq_status")
      .eq("id", wpqId)
      .eq("welder_id", id)
      .eq("org_id", org.id)
      .single(),
  ]);

  if (!welder || !wpq) notFound();

  const w = welder as Pick<Welder, "full_name" | "welder_id">;
  const q = wpq as Pick<
    QualificationRecord,
    "id" | "process" | "process_2" | "joint_type" | "wpq_status"
  >;

  if (q.wpq_status !== "Approved") {
    notFound();
  }

  const qualLabel = `${qualificationProcessLabel(q.process, q.process_2)} · ${q.joint_type === "BW" ? "Butt weld" : "Fillet weld"}`;
  const previewSrc = `/api/welders/${id}/certificate?wpq=${wpqId}`;
  const downloadSrc = `/api/welders/${id}/certificate?wpq=${wpqId}&download=1`;

  return (
    <>
      <PageHeader
        title="Qualification certificate"
        description={`${w.full_name} · ${w.welder_id ?? "—"} · ${qualLabel}`}
      />
      <div className="px-8 py-8">
        <PdfPreview
          src={previewSrc}
          backHref={`/welders/${id}?wpq=${wpqId}`}
          downloadHref={downloadSrc}
          title={`Certificate — ${w.full_name}`}
        />
        <p className="mt-4 text-sm text-graphite">
          Sign this certificate by hand, then upload the scanned copy from the
          welder profile under this qualification.
        </p>
      </div>
    </>
  );
}
