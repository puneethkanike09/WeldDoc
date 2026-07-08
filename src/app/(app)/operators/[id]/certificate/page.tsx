import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { PdfPreview } from "@/components/app/pdf-preview";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { processLabel } from "@/lib/iso14732/constants";
import type { Operator, OperatorQualification } from "@/types/db";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oq?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { oq: oqId } = await searchParams;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("full_name")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!operator || !oqId) {
    return { title: "Certificate preview" };
  }

  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("process, welding_mode")
    .eq("id", oqId)
    .eq("operator_id", id)
    .eq("org_id", org.id)
    .single();

  const q = oq as Pick<OperatorQualification, "process" | "welding_mode"> | null;
  const qual = q
    ? [processLabel(q.process), q.welding_mode].filter(Boolean).join(" · ")
    : "Qualification";

  return {
    title: `Certificate — ${operator.full_name} (${qual})`,
  };
}

export default async function OperatorCertificatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oq?: string }>;
}) {
  const { id } = await params;
  const { oq: oqId } = await searchParams;
  if (!oqId) notFound();

  const { org } = await requireSession();
  const supabase = await createClient();

  const [{ data: operator }, { data: oq }] = await Promise.all([
    supabase
      .from("operators")
      .select("full_name, operator_id")
      .eq("id", id)
      .eq("org_id", org.id)
      .single(),
    supabase
      .from("operator_qualifications")
      .select("id, process, welding_mode, oq_status")
      .eq("id", oqId)
      .eq("operator_id", id)
      .eq("org_id", org.id)
      .single(),
  ]);

  if (!operator || !oq) notFound();

  const o = operator as Pick<Operator, "full_name" | "operator_id">;
  const q = oq as Pick<
    OperatorQualification,
    "id" | "process" | "welding_mode" | "oq_status"
  >;

  if (q.oq_status !== "Approved") {
    notFound();
  }

  const qualLabel = [processLabel(q.process), q.welding_mode]
    .filter(Boolean)
    .join(" · ");
  const previewSrc = `/api/operators/${id}/certificate?oq=${oqId}`;
  const downloadSrc = `/api/operators/${id}/certificate?oq=${oqId}&download=1`;

  return (
    <>
      <PageHeader
        title="Qualification certificate"
        description={`${o.full_name} · ${o.operator_id ?? "—"} · ${qualLabel}`}
      />
      <div className="px-8 py-8">
        <PdfPreview
          src={previewSrc}
          backHref={`/operators/${id}?oq=${oqId}`}
          downloadHref={downloadSrc}
          title={`Certificate — ${o.full_name}`}
        />
        <p className="mt-4 text-sm text-graphite">
          Sign this certificate by hand, then upload the scanned copy from the
          operator profile under this qualification.
        </p>
      </div>
    </>
  );
}
