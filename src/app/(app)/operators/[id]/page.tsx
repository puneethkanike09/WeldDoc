import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import {
  normalizePlantOperatorId,
} from "@/lib/operators/plant-id";
import { resolveUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { summarizeOperator, STATUS_TONE } from "@/lib/operator-status";
import { QrDialog } from "@/components/app/qr-dialog";
import { StatusControl } from "./status-control";
import type { Operator, OperatorQualification } from "@/types/db";
import { ArrowLeft, IdCard, Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Operator profile" };

export default async function OperatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!operator) notFound();
  const o = operator as Operator;

  const { data: oqRows } = await supabase
    .from("operator_qualifications")
    .select("id, process, oq_status, expiry_date")
    .eq("operator_id", id);
  const oqs = (oqRows ?? []) as OperatorQualification[];

  const summary = summarizeOperator(o, oqs);
  const photoUrl = await resolveUrl("welder-photos", o.photo_path);
  const plantOperatorId =
    normalizePlantOperatorId(o.operator_id) ??
    o.operator_id?.trim() ??
    "—";

  return (
    <>
      <PageHeader title={o.full_name} description={plantOperatorId}>
        <ButtonLink href={`/operators/${id}/edit`} variant="ghost" size="sm">
          <Pencil className="h-4 w-4" /> Edit
        </ButtonLink>
        <ButtonLink href={`/operators/${id}/id-card`} variant="ghost" size="sm">
          <IdCard className="h-4 w-4" /> ID card
        </ButtonLink>
        <QrDialog qrToken={o.qr_token} plantWelderId={plantOperatorId} />
      </PageHeader>

      <div className="page-content">
        <Link
          href="/operators"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to operators
        </Link>

        <Card className="mb-6">
          <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={o.full_name}
                  className="h-16 w-16 rounded-button object-cover"
                />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-button bg-onyx/5 font-display text-xl font-semibold text-graphite">
                  {o.full_name.slice(0, 1)}
                </span>
              )}
              <div>
                <Badge tone={STATUS_TONE[summary.overall]}>
                  {summary.overall}
                </Badge>
                <p className="mt-2 font-mono text-[13px] text-charcoal">
                  {plantOperatorId}
                </p>
              </div>
            </div>

            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3 lg:max-w-3xl">
              <Detail
                label="Date of birth"
                value={formatDate(o.date_of_birth)}
              />
              <Detail label="Place of birth" value={o.place_of_birth} />
              <Detail label="ID method" value={o.id_method} />
              <Detail label="ID number" value={o.id_number} />
              <Detail label="Employer" value={o.employer} />
              <Detail label="Branch" value={o.branch_location} />
            </dl>

            <div className="lg:w-52 lg:shrink-0">
              <p className="mb-1.5 font-display text-[13px] font-medium text-charcoal">
                Status
              </p>
              <StatusControl operatorId={id} status={o.status} />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-steel">
        {label}
      </dt>
      <dd className="font-medium text-onyx">{value || "—"}</dd>
    </div>
  );
}
