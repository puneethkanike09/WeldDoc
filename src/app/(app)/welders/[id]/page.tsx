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
  normalizePlantWelderId,
  plantWelderIdFromUid,
} from "@/lib/welders/plant-id";
import { resolveUrl } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { summarizeWelder, STATUS_TONE } from "@/lib/welder-status";
import { QrDialog } from "@/components/app/qr-dialog";
import { StatusControl } from "./status-control";
import type { QualificationRecord, Welder } from "@/types/db";
import { ArrowLeft, IdCard, Pencil } from "lucide-react";

export const metadata: Metadata = { title: "Welder profile" };

export default async function WelderProfilePage({
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
  const w = welder as Welder;

  const { data: wpqRows } = await supabase
    .from("qualification_records")
    .select("id, process, wpq_status, expiry_date")
    .eq("welder_id", id);
  const wpqs = (wpqRows ?? []) as QualificationRecord[];

  const summary = summarizeWelder(w, wpqs);
  const photoUrl = await resolveUrl("welder-photos", w.photo_path);
  const plantWelderId =
    normalizePlantWelderId(w.welder_id) ??
    w.welder_id?.trim() ??
    plantWelderIdFromUid(w.uid) ??
    w.uid;

  return (
    <>
      <PageHeader title={w.full_name} description={`UID ${w.uid}`}>
        <ButtonLink href={`/welders/${id}/edit`} variant="ghost" size="sm">
          <Pencil className="h-4 w-4" /> Edit
        </ButtonLink>
        <ButtonLink href={`/welders/${id}/id-card`} variant="ghost" size="sm">
          <IdCard className="h-4 w-4" /> ID card
        </ButtonLink>
        <QrDialog qrToken={w.qr_token} plantWelderId={plantWelderId} />
      </PageHeader>

      <div className="px-8 py-8">
        <Link
          href="/welders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-graphite hover:text-onyx"
        >
          <ArrowLeft className="h-4 w-4" /> Back to welders
        </Link>

        <Card className="mb-6">
          <CardBody className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={w.full_name}
                  className="h-16 w-16 rounded-button object-cover"
                />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-button bg-onyx/5 font-display text-xl font-semibold text-graphite">
                  {w.full_name.slice(0, 1)}
                </span>
              )}
              <div>
                <Badge tone={STATUS_TONE[summary.overall]}>
                  {summary.overall}
                </Badge>
                <p className="mt-2 font-mono text-[13px] text-charcoal">
                  {w.uid}
                </p>
                <p className="text-xs text-steel">{plantWelderId}</p>
              </div>
            </div>

            <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3 lg:max-w-3xl">
              <Detail
                label="Date of birth"
                value={formatDate(w.date_of_birth)}
              />
              <Detail label="Place of birth" value={w.place_of_birth} />
              <Detail label="ID method" value={w.id_method} />
              <Detail label="ID number" value={w.id_number} />
              <Detail label="Employer" value={w.employer} />
              <Detail label="Branch" value={w.branch_location} />
              {w.email ? <Detail label="Email" value={w.email} /> : null}
            </dl>

            <div className="lg:w-52 lg:shrink-0">
              <p className="mb-1.5 font-display text-[13px] font-medium text-charcoal">
                Status
              </p>
              <StatusControl welderId={id} status={w.status} />
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
