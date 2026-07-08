"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Badge } from "@/components/ui/badge";
import {
  GroupStepPreviousLink,
  QualifyHeader,
  QualifySubmit,
  invalidBorder,
} from "@/components/qualify/wizard-chrome";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";
import { Iso14732TablePdfGlobe } from "@/components/qualify/iso14732-pdf-drawer";
import { ValidatedForm } from "@/lib/form-toast";
import { getCertificateIssueFieldErrors } from "@/lib/iso9606/qualification-fields";
import { getOperatorCertificateIssueFieldErrors } from "@/lib/iso14732/qualification-fields";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, ShieldCheck } from "lucide-react";

export interface GroupCertificateMember {
  memberId: string;
  personId: string;
  personName: string;
  plantId: string | null;
  memberStatus: string;
  qualificationId: string | null;
  rangeSummary: string | null;
  profileHref: string;
  ndtReady: boolean;
  defaultExaminerName: string | null;
  defaultCertDate: string | null;
  defaultJobKnowledge?: string | null;
  supplementaryFillet?: boolean;
}

export function GroupWelderCertificateStep({
  issueAction,
  baseHref,
  members,
}: {
  issueAction: (memberId: string, fd: FormData) => Promise<void>;
  baseHref: string;
  members: GroupCertificateMember[];
}) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <QualifyHeader
          title="Step 4 — Generate certificate"
          sub="Review the computed range, confirm the date and issue the certificate for each welder. The printed certificate is signed by hand."
        />
        <div className="space-y-4">
          {members.map((m) => (
            <WelderMemberCertificateCard
              key={m.memberId}
              member={m}
              issueAction={issueAction}
            />
          ))}
        </div>
        <GroupStepPreviousLink baseHref={baseHref} step={4} />
      </CardBody>
    </Card>
  );
}

function WelderMemberCertificateCard({
  member,
  issueAction,
}: {
  member: GroupCertificateMember;
  issueAction: (memberId: string, fd: FormData) => Promise<void>;
}) {
  const boundAction = issueAction.bind(null, member.memberId);
  const validate = useCallback(
    (formData: FormData) => getCertificateIssueFieldErrors(formData),
    [],
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h4 className="font-display text-base font-semibold text-onyx">
            {member.personName}
            {member.plantId ? (
              <span className="ml-2 font-mono text-xs font-normal text-steel">
                {member.plantId}
              </span>
            ) : null}
          </h4>
        </div>

        {member.memberStatus === "Approved" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="active">Certificate issued</Badge>
            <Link
              href={member.profileHref}
              className="inline-flex items-center gap-1 text-sm text-ember hover:underline"
            >
              View profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : !member.qualificationId ? (
          <Badge tone="expiring">Qualification missing — re-save steps 1–2</Badge>
        ) : member.memberStatus === "Failed" || !member.ndtReady ? (
          <Badge tone="expiring">
            {member.memberStatus === "Failed" ? "NDT failed" : "NDT incomplete"}
          </Badge>
        ) : (
          <ValidatedForm action={boundAction} validate={validate}>
            {({ fieldErrors, clearError }) => (
              <>
                <div className="rounded-[10px] bg-frost p-4">
                  <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                    Computed range of approval
                  </p>
                  <p className="mt-1 text-[14px] text-charcoal">
                    {member.rangeSummary ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-steel">
                    This range is locked from the test parameters and cannot be
                    edited (compliance protection).
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Certificate date"
                    required
                    error={fieldErrors.certificate_date}
                  >
                    <DatePicker
                      name="certificate_date"
                      defaultValue={
                        member.defaultCertDate ??
                        new Date().toISOString().slice(0, 10)
                      }
                      required
                      error={fieldErrors.certificate_date}
                    />
                  </Field>
                  <Field
                    label="Authorised examiner name"
                    required
                    error={fieldErrors.examiner_name}
                  >
                    <Input
                      name="examiner_name"
                      defaultValue={member.defaultExaminerName ?? ""}
                      placeholder="Examiner / examining body"
                      required
                      className={cn(fieldErrors.examiner_name && invalidBorder)}
                      onChange={() => clearError("examiner_name")}
                    />
                  </Field>
                  <Field
                    label="Job knowledge"
                    required
                    error={fieldErrors.job_knowledge}
                    labelAccessory={<Iso9606TablePdfGlobe table="jobKnowledge" />}
                  >
                    <Select
                      name="job_knowledge"
                      defaultValue={member.defaultJobKnowledge ?? "Not tested"}
                      required
                      className={cn(fieldErrors.job_knowledge && invalidBorder)}
                      onChange={() => clearError("job_knowledge")}
                    >
                      <option value="Acceptable">Acceptable</option>
                      <option value="Not tested">Not tested</option>
                    </Select>
                  </Field>
                </div>

                {member.supplementaryFillet ? (
                  <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-charcoal">
                    Supplementary fillet weld test was recorded on the
                    qualification plan (Step 1).
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {member.ndtReady ? (
                    <Badge tone="active">
                      <Check className="h-3.5 w-3.5" /> All selected tests
                      passed
                    </Badge>
                  ) : (
                    <Badge tone="expiring">NDT incomplete</Badge>
                  )}
                  <QualifySubmit label="Issue certificate" icon={ShieldCheck} />
                </div>
              </>
            )}
          </ValidatedForm>
        )}
      </CardBody>
    </Card>
  );
}

export function GroupOperatorCertificateStep({
  issueAction,
  baseHref,
  members,
}: {
  issueAction: (memberId: string, fd: FormData) => Promise<void>;
  baseHref: string;
  members: GroupCertificateMember[];
}) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <QualifyHeader
          title="Step 4 — Generate certificate"
          sub="Review the computed range, confirm the date and issue the certificate for each operator. The printed certificate is signed by hand."
        />
        <div className="space-y-4">
          {members.map((m) => (
            <OperatorMemberCertificateCard
              key={m.memberId}
              member={m}
              issueAction={issueAction}
            />
          ))}
        </div>
        <GroupStepPreviousLink baseHref={baseHref} step={4} />
      </CardBody>
    </Card>
  );
}

function OperatorMemberCertificateCard({
  member,
  issueAction,
}: {
  member: GroupCertificateMember;
  issueAction: (memberId: string, fd: FormData) => Promise<void>;
}) {
  const boundAction = issueAction.bind(null, member.memberId);
  const validate = useCallback(
    (formData: FormData) => getOperatorCertificateIssueFieldErrors(formData),
    [],
  );

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <h4 className="font-display text-base font-semibold text-onyx">
            {member.personName}
            {member.plantId ? (
              <span className="ml-2 font-mono text-xs font-normal text-steel">
                {member.plantId}
              </span>
            ) : null}
          </h4>
        </div>

        {member.memberStatus === "Approved" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="active">Certificate issued</Badge>
            <Link
              href={member.profileHref}
              className="inline-flex items-center gap-1 text-sm text-ember hover:underline"
            >
              View profile <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : !member.qualificationId ? (
          <Badge tone="expiring">Qualification missing — re-save steps 1–2</Badge>
        ) : member.memberStatus === "Failed" || !member.ndtReady ? (
          <Badge tone="expiring">
            {member.memberStatus === "Failed" ? "NDT failed" : "NDT incomplete"}
          </Badge>
        ) : (
          <ValidatedForm action={boundAction} validate={validate}>
            {({ fieldErrors, clearError }) => (
              <>
                <div className="rounded-[10px] bg-frost p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                      Computed range of qualification
                    </p>
                    <Iso14732TablePdfGlobe table="certificate" />
                  </div>
                  <p className="mt-1 text-[14px] text-charcoal">
                    {member.rangeSummary ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-steel">
                    This range is locked from the test parameters and cannot be
                    edited (compliance protection).
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Certificate date"
                    required
                    error={fieldErrors.certificate_date}
                  >
                    <DatePicker
                      name="certificate_date"
                      defaultValue={
                        member.defaultCertDate ??
                        new Date().toISOString().slice(0, 10)
                      }
                      required
                      error={fieldErrors.certificate_date}
                    />
                  </Field>
                  <Field
                    label="Authorised examiner name"
                    required
                    error={fieldErrors.examiner_name}
                  >
                    <Input
                      name="examiner_name"
                      defaultValue={member.defaultExaminerName ?? ""}
                      placeholder="Examiner / examining body"
                      required
                      className={cn(fieldErrors.examiner_name && invalidBorder)}
                      onChange={() => clearError("examiner_name")}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {member.ndtReady ? (
                    <Badge tone="active">
                      <Check className="h-3.5 w-3.5" /> All required tests passed
                    </Badge>
                  ) : (
                    <Badge tone="expiring">NDT incomplete</Badge>
                  )}
                  <QualifySubmit label="Issue certificate" icon={ShieldCheck} />
                </div>
              </>
            )}
          </ValidatedForm>
        )}
      </CardBody>
    </Card>
  );
}
