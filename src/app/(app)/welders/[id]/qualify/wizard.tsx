"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  TESTING_STANDARDS,
  WELDING_PROCESSES,
  PRODUCT_TYPES,
  JOINT_TYPES,
  BW_POSITIONS,
  FW_POSITIONS,
  POSITION_LABELS,
  MATERIAL_GROUPS,
  FILLER_GROUPS,
  FILLER_TYPES,
  CURRENT_POLARITY,
  LAYER_TYPES,
  REVALIDATION_METHODS,
  OPTIONAL_TESTS,
  WELD_DETAILS,
  TRANSFER_MODE_OPTIONS,
  requiredTestsFor,
} from "@/lib/iso9606/constants";
import {
  getCertificateIssueFieldErrors,
  getNdtFieldErrors,
  getQualificationPlanFieldErrors,
  getTestPieceFieldErrors,
} from "@/lib/iso9606/qualification-fields";
import { MaterialGradeLookup } from "@/components/qualify/material-grade-lookup";
import {
  DissimilarMaterials,
  ProductDimensions,
} from "@/components/qualify/qualification-field-blocks";
import type {
  JointCategory,
  NdtDtRecord,
  QualificationRecord,
  Signatory,
} from "@/types/db";
import type { FieldErrors } from "@/lib/field-errors";
import { cn } from "@/lib/utils";
import { ValidatedForm, useFormPending } from "@/lib/form-toast";
import { Check, Loader2, Save, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS = ["Plan", "Test piece", "NDT / DT", "Certificate"] as const;
const invalidBorder = "border-ember ring-1 ring-ember/20";

function Submit({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
  const pending = useFormPending();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}

export function Stepper({
  step,
  wpqId,
  welderId,
}: {
  step: number;
  wpqId: string | null;
  welderId: string;
}) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        const reachable = wpqId !== null && n <= step;
        const content = (
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full font-display text-[13px] font-semibold",
                active && "bg-inverse-bg text-inverse-fg",
                done && "bg-active-ink text-white",
                !active && !done && "bg-onyx/5 text-steel",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span
              className={cn(
                "text-[14px] font-medium",
                active ? "text-onyx" : "text-graphite",
              )}
            >
              {label}
            </span>
          </div>
        );
        return (
          <div key={label} className="flex items-center gap-2">
            {reachable && !active ? (
              <Link
                href={`/welders/${welderId}/qualify?wpq=${wpqId}&step=${n}`}
              >
                {content}
              </Link>
            ) : (
              content
            )}
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-6 bg-silver" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PlanStep({
  action,
  wpq,
  orgName,
  orgLocation,
}: {
  action: (fd: FormData) => void;
  wpq: QualificationRecord | null;
  orgName: string;
  orgLocation: string | null;
}) {
  const validate = useCallback(
    (formData: FormData) => getQualificationPlanFieldErrors(formData),
    [],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 1 — Qualification plan"
              sub="Page 1 of the client registry: standard, process, WPS, examiner and revalidation method."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Code / testing standard" required error={fieldErrors.testing_standard}>
                <Select
                  name="testing_standard"
                  defaultValue={wpq?.testing_standard ?? "EN ISO 9606-1:2017"}
                  required
                  className={cn(fieldErrors.testing_standard && invalidBorder)}
                  onChange={() => clearError("testing_standard")}
                >
                  {TESTING_STANDARDS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Welding process (ISO 4063)" required error={fieldErrors.process}>
                <Select
                  name="process"
                  defaultValue={wpq?.process ?? "135"}
                  required
                  className={cn(fieldErrors.process && invalidBorder)}
                  onChange={() => clearError("process")}
                >
                  {WELDING_PROCESSES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} — {p.code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Joint type" required error={fieldErrors.joint_type}>
                <Select
                  name="joint_type"
                  defaultValue={wpq?.joint_type ?? "BW"}
                  required
                  className={cn(fieldErrors.joint_type && invalidBorder)}
                  onChange={() => clearError("joint_type")}
                >
                  {JOINT_TYPES.map((j) => (
                    <option key={j.code} value={j.code}>
                      {j.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Product type" required error={fieldErrors.product}>
                <Select
                  name="product"
                  defaultValue={wpq?.product ?? "Plate"}
                  required
                  className={cn(fieldErrors.product && invalidBorder)}
                  onChange={() => clearError("product")}
                >
                  {PRODUCT_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Welding position" required error={fieldErrors.position}>
                <Select
                  name="position"
                  defaultValue={wpq?.position ?? "PF"}
                  required
                  className={cn(fieldErrors.position && invalidBorder)}
                  onChange={() => clearError("position")}
                >
                  {Array.from(new Set([...BW_POSITIONS, ...FW_POSITIONS])).map(
                    (p) => (
                      <option key={p} value={p}>
                        {POSITION_LABELS[p] ?? p}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
              <Field label="Parent material group" required error={fieldErrors.base_material_group}>
                <Select
                  name="base_material_group"
                  defaultValue={wpq?.base_material_group ?? "1"}
                  required
                  className={cn(fieldErrors.base_material_group && invalidBorder)}
                  onChange={() => clearError("base_material_group")}
                >
                  {MATERIAL_GROUPS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="WPS reference" required error={fieldErrors.wps_reference}>
                <Input
                  name="wps_reference"
                  defaultValue={wpq?.wps_reference ?? ""}
                  placeholder="ACME/PLT-A/QA/WPS-075 REV-02"
                  required
                  className={cn(fieldErrors.wps_reference && invalidBorder)}
                  onChange={() => clearError("wps_reference")}
                />
              </Field>
              <Field label="Employer">
                <Input name="employer_display" value={orgName} disabled />
              </Field>
              <Field label="Branch / site">
                <Input
                  name="branch_display"
                  value={orgLocation ?? "—"}
                  disabled
                />
              </Field>
              <Field label="Date of welding test" required error={fieldErrors.date_of_welding}>
                <DatePicker
                  name="date_of_welding"
                  defaultValue={wpq?.date_of_welding ?? ""}
                  required
                  error={fieldErrors.date_of_welding}
                />
              </Field>
              <Field label="Examiner / body reference" required error={fieldErrors.examiner_ref}>
                <Input
                  name="examiner_ref"
                  defaultValue={wpq?.examiner_ref ?? ""}
                  placeholder="Third-party examiner ref."
                  required
                  className={cn(fieldErrors.examiner_ref && invalidBorder)}
                  onChange={() => clearError("examiner_ref")}
                />
              </Field>
              <Field label="Examiner / examining body name" required error={fieldErrors.examiner_name}>
                <Input
                  name="examiner_name"
                  defaultValue={wpq?.examiner_name ?? ""}
                  placeholder="Jordan Lee"
                  required
                  className={cn(fieldErrors.examiner_name && invalidBorder)}
                  onChange={() => clearError("examiner_name")}
                />
              </Field>
              <Field label="Revalidation method (cl. 9.3)" required error={fieldErrors.revalidation_method}>
                <Select
                  name="revalidation_method"
                  defaultValue={wpq?.revalidation_method ?? "9.3b"}
                  required
                  className={cn(fieldErrors.revalidation_method && invalidBorder)}
                  onChange={() => clearError("revalidation_method")}
                >
                  {REVALIDATION_METHODS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="flex justify-end">
              <Submit label="Save & continue" icon={Save} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

export function TestStep({
  action,
  wpq,
  rangePreview,
}: {
  action: (fd: FormData) => void;
  wpq: QualificationRecord;
  rangePreview: string | null;
}) {
  const positions = wpq.joint_type === "FW" ? FW_POSITIONS : BW_POSITIONS;
  const pipeRequired = wpq.product === "Pipe" || wpq.product === "Branch";

  const validate = useCallback(
    (formData: FormData) =>
      getTestPieceFieldErrors(formData, wpq.joint_type, wpq.product),
    [wpq.joint_type, wpq.product],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 2 — Test piece record"
              sub="Page 1 continued: materials, dimensions, filler and test piece parameters."
            />
            <MaterialGradeLookup
              defaultStandard={wpq.material_specification ?? ""}
              defaultGrade={wpq.material_grade ?? ""}
              defaultGroup={wpq.base_material_group ?? "1"}
              errors={{
                material_standard: fieldErrors.material_standard,
                material_grade: fieldErrors.material_grade,
                base_material_group: fieldErrors.base_material_group,
              }}
              onFieldChange={clearError}
            />
            <DissimilarMaterials
              defaultSpec={wpq.material2_specification ?? ""}
              defaultGrade={wpq.material2_grade ?? ""}
              defaultGroup={wpq.material2_group ?? ""}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ProductDimensions
                wpq={wpq}
                errors={{
                  dimension_thickness_mm: fieldErrors.dimension_thickness_mm,
                  dimension_width_mm: fieldErrors.dimension_width_mm,
                  dimension_length_mm: fieldErrors.dimension_length_mm,
                }}
                onFieldChange={clearError}
              />
              <Field label="Confirm position" required error={fieldErrors.position}>
                <Select
                  name="position"
                  defaultValue={wpq.position ?? "PF"}
                  required
                  className={cn(fieldErrors.position && invalidBorder)}
                  onChange={() => clearError("position")}
                >
                  {positions.map((p) => (
                    <option key={p} value={p}>
                      {POSITION_LABELS[p] ?? p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Filler material group" required error={fieldErrors.filler_group}>
                <Select
                  name="filler_group"
                  defaultValue={wpq.filler_group ?? "FM1"}
                  required
                  className={cn(fieldErrors.filler_group && invalidBorder)}
                  onChange={() => clearError("filler_group")}
                >
                  {FILLER_GROUPS.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Filler designation" required error={fieldErrors.filler_designation}>
                <Input
                  name="filler_designation"
                  defaultValue={wpq.filler_designation ?? ""}
                  placeholder="ER70S-6 / SFA 5.18"
                  required
                  className={cn(fieldErrors.filler_designation && invalidBorder)}
                  onChange={() => clearError("filler_designation")}
                />
              </Field>
              <Field label="Filler type" required error={fieldErrors.filler_type}>
                <Select
                  name="filler_type"
                  defaultValue={wpq.filler_type ?? FILLER_TYPES[1]}
                  required
                  className={cn(fieldErrors.filler_type && invalidBorder)}
                  onChange={() => clearError("filler_type")}
                >
                  {FILLER_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Shielding gas" required error={fieldErrors.shielding_gas}>
                <Input
                  name="shielding_gas"
                  defaultValue={wpq.shielding_gas ?? ""}
                  placeholder="ISO 14175 - M21"
                  required
                  className={cn(fieldErrors.shielding_gas && invalidBorder)}
                  onChange={() => clearError("shielding_gas")}
                />
              </Field>
              <Field label="Current & polarity" required error={fieldErrors.current_polarity}>
                <Select
                  name="current_polarity"
                  defaultValue={wpq.current_polarity ?? "DCEP"}
                  required
                  className={cn(fieldErrors.current_polarity && invalidBorder)}
                  onChange={() => clearError("current_polarity")}
                >
                  {CURRENT_POLARITY.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Transfer mode" required error={fieldErrors.transfer_mode}>
                <Select
                  name="transfer_mode"
                  defaultValue={wpq.transfer_mode ?? "Spray"}
                  required
                  className={cn(fieldErrors.transfer_mode && invalidBorder)}
                  onChange={() => clearError("transfer_mode")}
                >
                  {TRANSFER_MODE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Weld details" required error={fieldErrors.weld_details}>
                <Select
                  name="weld_details"
                  defaultValue={wpq.weld_details ?? "ss nb"}
                  required
                  className={cn(fieldErrors.weld_details && invalidBorder)}
                  onChange={() => clearError("weld_details")}
                >
                  {WELD_DETAILS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Test thickness (mm)" required error={fieldErrors.test_thickness_mm}>
                <Input
                  type="number"
                  step="0.1"
                  name="test_thickness_mm"
                  defaultValue={wpq.test_thickness_mm ?? ""}
                  placeholder="12"
                  required
                  className={cn(fieldErrors.test_thickness_mm && invalidBorder)}
                  onChange={() => clearError("test_thickness_mm")}
                />
              </Field>
              <Field
                label="Deposited / throat thickness (mm)"
                required
                error={fieldErrors.deposited_thickness_mm}
              >
                <Input
                  type="number"
                  step="0.1"
                  name="deposited_thickness_mm"
                  defaultValue={wpq.deposited_thickness_mm ?? ""}
                  required
                  className={cn(fieldErrors.deposited_thickness_mm && invalidBorder)}
                  onChange={() => clearError("deposited_thickness_mm")}
                />
              </Field>
              <Field
                label="Pipe outside diameter (mm)"
                required={pipeRequired}
                error={fieldErrors.pipe_od_mm}
              >
                <Input
                  type="number"
                  step="0.1"
                  name="pipe_od_mm"
                  defaultValue={wpq.pipe_od_mm ?? ""}
                  placeholder="42.4"
                  required={pipeRequired}
                  className={cn(fieldErrors.pipe_od_mm && invalidBorder)}
                  onChange={() => clearError("pipe_od_mm")}
                />
              </Field>
              <Field label="Layer" required error={fieldErrors.layer_type}>
                <Select
                  name="layer_type"
                  defaultValue={wpq.layer_type ?? LAYER_TYPES[1]}
                  required
                  className={cn(fieldErrors.layer_type && invalidBorder)}
                  onChange={() => clearError("layer_type")}
                >
                  {LAYER_TYPES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {rangePreview && (
              <div className="rounded-[10px] border border-sapphire/20 bg-sapphire/5 p-3">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-sapphire">
                  Range of approval preview
                </p>
                <p className="mt-1 text-[13.5px] text-charcoal">
                  {rangePreview}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Submit label="Save & continue" icon={Save} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

export function NdtStep({
  action,
  jointType,
  existing,
}: {
  action: (fd: FormData) => void;
  jointType: JointCategory;
  existing: NdtDtRecord[];
}) {
  const required = requiredTestsFor(jointType);
  const byMethod = new Map(existing.map((e) => [e.test_method, e]));

  const validate = useCallback(
    (formData: FormData) => getNdtFieldErrors(formData, jointType),
    [jointType],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 3 — NDT / DT results"
              sub={`Required for ${
                jointType === "BW" ? "butt welds" : "fillet welds"
              }: ${required.join(", ")}. All required tests must pass to issue a certificate.`}
            />

            <div className="space-y-3">
              {required.map((method) => (
                <TestRow
                  key={method}
                  method={method}
                  required
                  existing={byMethod.get(method)}
                  fieldErrors={fieldErrors}
                  clearError={clearError}
                />
              ))}
            </div>

            <details className="rounded-[10px] border border-silver">
              <summary className="cursor-pointer px-4 py-3 text-[14px] font-medium text-charcoal">
                Add optional tests (PT, bend, tensile, macro)
              </summary>
              <div className="space-y-3 border-t border-silver p-4">
                {OPTIONAL_TESTS.map((method) => (
                  <label key={method} className="block">
                    <span className="mb-2 flex items-center gap-2 text-[14px] text-charcoal">
                      <input
                        type="checkbox"
                        name="optional_method"
                        value={method}
                        defaultChecked={byMethod.has(method)}
                        className="h-4 w-4 accent-[#f90a08]"
                      />
                      {method}
                    </span>
                    <TestRow
                      method={method}
                      existing={byMethod.get(method)}
                      compact
                      fieldErrors={fieldErrors}
                      clearError={clearError}
                    />
                  </label>
                ))}
              </div>
            </details>

            <div className="flex justify-end">
              <Submit label="Save results" icon={Check} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

function TestRow({
  method,
  required,
  existing,
  compact,
  fieldErrors,
  clearError,
}: {
  method: string;
  required?: boolean;
  existing?: NdtDtRecord;
  compact?: boolean;
  fieldErrors: FieldErrors;
  clearError: (key: string) => void;
}) {
  const resultKey = `result__${method}`;
  const dateKey = `test_date__${method}`;
  const refKey = `conducted_by__${method}`;

  return (
    <div
      className={cn(
        "grid items-end gap-3 rounded-[10px] sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr]",
        !compact && "border border-silver bg-frost/50 p-3",
      )}
    >
      <div>
        {!compact && (
          <p className="text-[14px] font-medium text-onyx">
            {method}{" "}
            {required && <span className="text-ember">*</span>}
          </p>
        )}
      </div>
      <Field label="Result" required={required} error={fieldErrors[resultKey]}>
        <Select
          name={resultKey}
          defaultValue={existing?.result ?? (required ? "Pass" : "NA")}
          required={required}
          className={cn(fieldErrors[resultKey] && invalidBorder)}
          onChange={() => clearError(resultKey)}
        >
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
          <option value="NA">N/A</option>
        </Select>
      </Field>
      <Field label="Test date" required={required} error={fieldErrors[dateKey]}>
        <DatePicker
          name={dateKey}
          defaultValue={existing?.test_date ?? ""}
          required={required}
          error={fieldErrors[dateKey]}
        />
      </Field>
      <Field label="Report / ref no." required={required} error={fieldErrors[refKey]}>
        <Input
          name={refKey}
          defaultValue={existing?.conducted_by ?? ""}
          placeholder="NDT report no."
          required={required}
          className={cn(fieldErrors[refKey] && invalidBorder)}
          onChange={() => clearError(refKey)}
        />
      </Field>
      <Field label="Report PDF">
        <FileDropzone
          name={`report__${method}`}
          accept="application/pdf,image/*"
          compact
          defaultLabel={
            existing?.report_pdf_path ? "Replace report" : undefined
          }
          placeholder="Drop PDF or click to browse"
        />
      </Field>
    </div>
  );
}

export function CertificateStep({
  action,
  wpq,
  rangeSummary,
  signatories,
}: {
  action: (fd: FormData) => void;
  wpq: QualificationRecord;
  rangeSummary: string | null;
  signatories: Signatory[];
}) {
  const validate = useCallback(
    (formData: FormData) => getCertificateIssueFieldErrors(formData),
    [],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 4 — Generate certificate"
              sub="Review the computed range, confirm the date and issue the stamped certificate."
            />

            <div className="rounded-[10px] bg-frost p-4">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                Computed range of approval
              </p>
              <p className="mt-1 text-[14px] text-charcoal">
                {rangeSummary ?? "—"}
              </p>
              <p className="mt-2 text-xs text-steel">
                This range is locked from the test parameters and cannot be
                edited (compliance protection).
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Certificate date" required error={fieldErrors.certificate_date}>
                <DatePicker
                  name="certificate_date"
                  defaultValue={
                    wpq.certificate_issued_date ??
                    new Date().toISOString().slice(0, 10)
                  }
                  required
                  error={fieldErrors.certificate_date}
                />
              </Field>
              <Field label="Authorised examiner name" required error={fieldErrors.examiner_name}>
                <Input
                  name="examiner_name"
                  defaultValue={wpq.examiner_name ?? ""}
                  placeholder="Examiner / examining body"
                  required
                  className={cn(fieldErrors.examiner_name && invalidBorder)}
                  onChange={() => clearError("examiner_name")}
                />
              </Field>
              <Field label="Job knowledge" required error={fieldErrors.job_knowledge}>
                <Select
                  name="job_knowledge"
                  defaultValue={wpq.job_knowledge ?? "Not tested"}
                  required
                  className={cn(fieldErrors.job_knowledge && invalidBorder)}
                  onChange={() => clearError("job_knowledge")}
                >
                  <option value="Acceptable">Acceptable</option>
                  <option value="Not tested">Not tested</option>
                </Select>
              </Field>
            </div>

            <label className="flex items-start gap-3 rounded-[10px] bg-frost px-4 py-3">
              <input
                type="checkbox"
                name="supplementary_fillet"
                defaultChecked={wpq.supplementary_fillet}
                className="mt-0.5 h-4 w-4 accent-[#f90a08]"
              />
              <span className="text-[14px] text-charcoal">
                Supplementary fillet weld test completed in conjunction with this
                butt-weld qualification (acceptable).
              </span>
            </label>

            {signatories.length === 0 ? (
              <p className="rounded-[10px] bg-expiring/15 px-3 py-2 text-sm text-[#8a6a00]">
                Tip: add signatories with signature &amp; stamp images in
                Settings so they are applied automatically to the certificate
                PDF.
              </p>
            ) : (
              <p className="text-sm text-graphite">
                {signatories.length} signatory record(s) available for stamping.
              </p>
            )}

            <div className="flex items-center justify-between">
              <Badge tone="active">
                <Check className="h-3.5 w-3.5" /> All required tests passed
              </Badge>
              <Submit label="Issue certificate" icon={ShieldCheck} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-onyx">{title}</h3>
      <p className="mt-1 text-[14px] text-graphite">{sub}</p>
    </div>
  );
}
