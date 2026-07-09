"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/app/confirm-delete-button";
import { ValidationForm } from "@/components/qualify/validation-form";
import { NdtReportViewer } from "@/components/qualify/ndt-report-viewer";
import { SignedCertificateForm } from "@/app/(app)/welders/[id]/signed-certificate-form";
import { QualificationActiveControl } from "@/components/qualify/qualification-active-control";
import {
  certificateExpiryHeading,
  continuityExpiryHeading,
  continuityExpiryTone,
} from "@/lib/qualify/expiry-display";
import { useStandardPdfDrawer } from "@/components/qualify/iso9606-pdf-drawer";
import { FileText, Trash2, Workflow } from "lucide-react";

type BadgeTone = "active" | "expiring" | "expired" | "neutral" | "sapphire";

export interface NdtRecordView {
  id: string;
  label: string;
  result: string;
  testDate: string | null;
  reportRef: string | null;
  hasReport: boolean;
}

export interface ValidationView {
  id: string;
  kind: "continuity" | "revalidation";
  validatedOn: string;
  validatorName: string | null;
  note: string | null;
  newExpiry: string | null;
  nextContinuityDue: string | null;
  docUrl: string | null;
}

export interface QualProfileDetail {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: BadgeTone;
  expiry: string;
  daysToExpiry: number | null;
  continuityDue: string | null;
  daysToContinuityDue: number | null;
  isMultiProcess?: boolean;
  isLegacy: boolean;
  isActive: boolean;
  isApproved: boolean;
  hasSignedCertificate: boolean;
  canLogValidation: boolean;
  rangeSummary: string | null;
  ndtRecords: NdtRecordView[];
  validations: ValidationView[];
  groupSessionHref?: string | null;
  groupSessionLabel?: string | null;
}

function DocumentViewButton({
  src,
  title,
  label = "View",
}: {
  src: string;
  title: string;
  label?: string;
}) {
  const { open } = useStandardPdfDrawer();

  return (
    <button
      type="button"
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-steel hover:bg-frost hover:text-onyx"
      onClick={() =>
        open({
          src,
          title,
          description: title,
        })
      }
    >
      <FileText className="size-3.5" />
      {label}
    </button>
  );
}

export function QualificationProfileDetail({
  entityId,
  entityKind,
  selected,
  qualifyHref,
  onDeleteQual,
  onDeleteValidation,
  onSaveValidation,
  onUploadSignedCert,
  onSetQualificationActive,
  continuityLabel,
  certificateHint,
  deleteQualDescription,
}: {
  entityId: string;
  entityKind: "operator" | "welder";
  selected: QualProfileDetail;
  qualifyHref: string;
  onDeleteQual: () => Promise<void>;
  onDeleteValidation: (validationId: string) => Promise<void>;
  onSaveValidation: (fd: FormData) => Promise<void>;
  onUploadSignedCert?: (fd: FormData) => Promise<void>;
  onSetQualificationActive?: (active: boolean) => Promise<void>;
  continuityLabel: string;
  certificateHint: string;
  deleteQualDescription: string;
}) {
  const ndtPersonId = entityKind === "operator" ? { operatorId: entityId } : { welderId: entityId };
  const ndtWithReports = selected.ndtRecords.filter((r) => r.hasReport);
  const qualQuery =
    entityKind === "operator"
      ? `oq=${selected.id}`
      : `wpq=${selected.id}`;
  const apiBase = `/api/${entityKind}s/${entityId}`;
  const certificateTitle =
    entityKind === "operator" ? "Operator's Certificate" : "Welder's Certificate";
  const certificateSrc = `${apiBase}/certificate?${qualQuery}`;
  const signedCertificateSrc = `${apiBase}/signed-certificate?${qualQuery}`;
  const showCertificates = selected.isActive && selected.isApproved;
  const hasDocumentList =
    showCertificates ||
    ndtWithReports.length > 0 ||
    (selected.isActive && selected.hasSignedCertificate);
  const showDocumentsPanel =
    hasDocumentList || (showCertificates && onUploadSignedCert);

  return (
    <div className="min-w-0 rounded-[var(--radius-card)] border border-silver bg-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-onyx">
              {selected.title}
            </h3>
            <Badge tone={selected.statusTone}>{selected.statusLabel}</Badge>
            {selected.isMultiProcess && (
              <Badge tone="sapphire">Multi-process</Badge>
            )}
            {selected.isLegacy && <Badge tone="outline">Legacy</Badge>}
          </div>
          <p className="mt-1 text-[13px] text-steel">{selected.subtitle}</p>
          {selected.groupSessionHref && (
            <p className="mt-2 text-[13px] text-steel">
              Part of group session{" "}
              <Link
                href={selected.groupSessionHref}
                className="font-medium text-ember hover:underline"
              >
                {selected.groupSessionLabel ?? "View session"}
              </Link>
            </p>
          )}
        </div>
        <div className="space-y-3 text-right text-[13px]">
          <div>
            <p className="text-steel">
              {certificateExpiryHeading(
                selected.statusTone,
                selected.daysToExpiry,
              )}
            </p>
            <p className="font-medium text-onyx">{selected.expiry}</p>
            {selected.isActive &&
              selected.daysToExpiry !== null &&
              selected.daysToExpiry >= 0 &&
              selected.daysToExpiry <= 60 && (
                <p className="text-xs text-[#8a6a00]">
                  in {selected.daysToExpiry} days
                </p>
              )}
          </div>
          {selected.continuityDue ? (
            <div>
              <p
                className={cn(
                  continuityExpiryTone(selected.daysToContinuityDue) === "danger"
                    ? "text-ember"
                    : continuityExpiryTone(selected.daysToContinuityDue) ===
                        "warning"
                      ? "text-[#8a6a00]"
                      : "text-steel",
                )}
              >
                {continuityExpiryHeading(selected.daysToContinuityDue)}
              </p>
              <p
                className={cn(
                  "font-medium",
                  continuityExpiryTone(selected.daysToContinuityDue) === "danger"
                    ? "text-ember"
                    : continuityExpiryTone(selected.daysToContinuityDue) ===
                        "warning"
                      ? "text-[#8a6a00]"
                      : "text-onyx",
                )}
              >
                {selected.continuityDue}
              </p>
              {selected.isActive &&
                selected.daysToContinuityDue !== null &&
                selected.daysToContinuityDue >= 0 &&
                selected.daysToContinuityDue <= 60 && (
                  <p className="text-xs text-[#8a6a00]">
                    in {selected.daysToContinuityDue} days
                  </p>
                )}
            </div>
          ) : null}
        </div>
      </div>

      {!selected.isActive && (
        <p className="mt-3 rounded-[10px] bg-frost px-3 py-2 text-[13px] text-steel">
          This qualification is inactive. It appears here for reference only and
          is excluded from the master list, ID card, dashboard counts, and expiry
          alerts.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-silver pb-4">
        <ButtonLink href={qualifyHref} variant="ghost" size="sm">
          <Workflow className="h-4 w-4" /> Open workflow
        </ButtonLink>
        <div className="flex flex-wrap items-center gap-3">
          {onSetQualificationActive && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-steel">Status</span>
              <QualificationActiveControl
                isActive={selected.isActive}
                onSetActive={onSetQualificationActive}
              />
            </div>
          )}
          <ConfirmDeleteButton
            key={selected.id}
            action={onDeleteQual}
            title="Delete this qualification?"
            description={deleteQualDescription}
            confirmLabel="Delete qualification"
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-ember hover:bg-ember/10 hover:text-ember"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-6 grid gap-6",
          showDocumentsPanel && "xl:grid-cols-2",
        )}
      >
        <div className="space-y-6">
          {selected.rangeSummary ? (
            <div className="rounded-[10px] bg-frost p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                Range of approval
              </p>
              <p className="mt-1 text-[13px] leading-snug text-charcoal">
                {selected.rangeSummary}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-steel">
              No range computed yet.{" "}
              <Link href={qualifyHref} className="text-ember hover:underline">
                Complete the workflow
              </Link>
            </p>
          )}

          <div>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
              Continuity &amp; revalidation log ({selected.validations.length})
            </p>
            {selected.validations.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {selected.validations.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-start justify-between gap-3 rounded-[10px] border border-silver px-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={v.kind === "revalidation" ? "sapphire" : "active"}
                        >
                          {v.kind === "revalidation"
                            ? "Revalidation"
                            : "Continuity"}
                        </Badge>
                        <span className="font-medium text-onyx">
                          {v.validatedOn}
                        </span>
                      </div>
                      {v.validatorName && (
                        <p className="mt-1 text-steel">By {v.validatorName}</p>
                      )}
                      {v.note && (
                        <p className="mt-0.5 text-graphite">{v.note}</p>
                      )}
                      {v.kind === "continuity"
                        ? v.nextContinuityDue && (
                            <p className="mt-0.5 text-steel">
                              Continuity confirmed · next due{" "}
                              {v.nextContinuityDue}
                            </p>
                          )
                        : v.newExpiry && (
                            <p className="mt-0.5 text-steel">
                              New expiry: {v.newExpiry}
                            </p>
                          )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {v.docUrl ? (
                        <DocumentViewButton
                          src={v.docUrl}
                          title={
                            v.kind === "revalidation"
                              ? `Revalidation — ${v.validatedOn}`
                              : `Continuity — ${v.validatedOn}`
                          }
                          label="View doc"
                        />
                      ) : (
                        <span className="text-xs text-steel">No doc</span>
                      )}
                      <ConfirmDeleteButton
                        action={() => onDeleteValidation(v.id)}
                        title="Delete this log entry?"
                        description="This removes the continuity/revalidation entry and its uploaded document. The qualification's current expiry date is not recalculated."
                        confirmLabel="Delete entry"
                        trigger={
                          <button
                            type="button"
                            aria-label="Delete log entry"
                            className="grid h-7 w-7 place-items-center rounded-sm text-steel hover:bg-ember/10 hover:text-ember"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-steel">
                No continuity or revalidation logged yet.
              </p>
            )}
          </div>

          {selected.canLogValidation && (
            <ValidationForm
              continuityLabel={continuityLabel}
              certificateHint={certificateHint}
              action={onSaveValidation}
            />
          )}
        </div>

        {showDocumentsPanel && (
          <div className="rounded-[10px] border border-silver p-4 xl:self-start">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
              Documents
            </p>

            {(hasDocumentList) && (
              <ul className="mt-3 space-y-2">
                {showCertificates && (
                  <li className="flex items-center justify-between gap-3 rounded-[10px] border border-silver bg-panel px-3 py-2.5 text-[13px]">
                    <span className="font-medium text-onyx">Certificate</span>
                    <DocumentViewButton
                      src={certificateSrc}
                      title={certificateTitle}
                    />
                  </li>
                )}
                {ndtWithReports.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-silver bg-panel px-3 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-onyx">{r.label}</span>
                      {r.testDate && (
                        <span className="ml-2 text-steel">{r.testDate}</span>
                      )}
                    </div>
                    <NdtReportViewer
                      {...ndtPersonId}
                      recordId={r.id}
                      testMethod={r.label}
                    />
                  </li>
                ))}
                {selected.isActive && selected.hasSignedCertificate && (
                  <li className="flex items-center justify-between gap-3 rounded-[10px] border border-silver bg-panel px-3 py-2.5 text-[13px]">
                    <span className="font-medium text-onyx">
                      Signed certificate
                    </span>
                    <DocumentViewButton
                      src={signedCertificateSrc}
                      title="Signed certificate"
                    />
                  </li>
                )}
              </ul>
            )}

            {showCertificates && onUploadSignedCert && (
              <div
                className={cn(hasDocumentList && "mt-4 border-t border-silver pt-4")}
              >
                <SignedCertificateForm
                  hasSignedCertificate={selected.hasSignedCertificate}
                  action={onUploadSignedCert}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
