"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  TESTING_STANDARDS,
  WELDING_PROCESSES,
  BW_POSITIONS,
  FW_POSITIONS,
  POSITION_LABELS,
  FILLER_GROUPS,
  CURRENT_POLARITY,
  LAYER_TYPES,
  REVALIDATION_METHODS,
  ALL_NDT_TESTS,
  WELD_DETAILS,
  TRANSFER_MODE_OPTIONS,
} from "@/lib/iso9606/constants";
import {
  getCertificateIssueFieldErrors,
  getNdtFieldErrors,
  initialSelectedNdtTests,
  getQualificationPlanFieldErrors,
  getTestPieceFieldErrors,
  ndtRecordForMethod,
} from "@/lib/iso9606/qualification-fields";
import { displayJointType } from "@/lib/iso9606/product-dimensions";
import { fillerTypesForProcess } from "@/lib/iso9606/filler-types";
import {
  SHIELDING_GAS_OPTIONS,
  defaultShieldingGasForProcess,
  normalizeShieldingGas,
} from "@/lib/iso9606/shielding-gas";
import { MaterialLookupPair } from "@/components/qualify/material-lookup-pair";
import { SupplementaryFilletFields } from "@/components/qualify/supplementary-fillet-fields";
import { NdtReportViewer } from "@/components/qualify/ndt-report-viewer";
import {
  qualifyDraftKey,
  loadQualifyDraft,
} from "@/lib/qualify/wizard-draft";
import { PlanProductJointFields } from "@/components/qualify/plan-product-joint-fields";
import { ProductDimensions } from "@/components/qualify/qualification-field-blocks";
import { Iso9606RevalidationPdfDrawer, Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";
import { branchDepositedThicknessLabel } from "@/lib/iso9606/branch-deposited-thickness";
import {
  showDepositedThicknessField,
  showTestThicknessField,
} from "@/lib/iso9606/test-piece-thickness";
import type {
  BranchConnection,
  JointCategory,
  NdtDtRecord,
  QualificationRecord,
} from "@/types/db";
import type { FieldErrors } from "@/lib/field-errors";
import { cn } from "@/lib/utils";
import { ValidatedForm, useFormPending } from "@/lib/form-toast";
import { ArrowLeft, Check, Loader2, Plus, Save, ShieldCheck, X } from "lucide-react";
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

function StepPreviousLink({
  welderId,
  wpqId,
  step,
}: {
  welderId: string;
  wpqId: string;
  step: number;
}) {
  const prev = step - 1;
  return (
    <ButtonLink
      href={`/welders/${welderId}/qualify?wpq=${wpqId}&step=${prev}`}
      variant="ghost"
      size="sm"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to {STEPS[prev - 1]}
    </ButtonLink>
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
                done && "step-done",
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
                className="rounded-[10px] transition-colors hover:bg-frost/80"
                title={`Back to ${label}`}
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
  welderId,
  draftStorageKeyOverride,
}: {
  action: (fd: FormData) => void;
  wpq: QualificationRecord | null;
  orgName: string;
  orgLocation: string | null;
  welderId: string;
  draftStorageKeyOverride?: string;
}) {
  const defaultJoint = displayJointType(
    wpq ?? { joint_type: "BW", joint_type_extended: null },
  );
  const [planJoint, setPlanJoint] = useState(defaultJoint);
  const [process1, setProcess1] = useState(wpq?.process ?? "135");
  const [process2, setProcess2] = useState<string | null>(
    wpq?.process_2 ?? null,
  );
  const validate = useCallback(
    (formData: FormData) => getQualificationPlanFieldErrors(formData),
    [],
  );
  const draftKey =
    draftStorageKeyOverride ??
    (wpq?.id ? qualifyDraftKey(welderId, wpq.id, 1) : null);

  return (
    <ValidatedForm
      action={action}
      validate={validate}
      draftStorageKey={draftKey}
      stepNumber={1}
    >
      {({ fieldErrors, clearError, draftRevision }) => {
        const draft =
          draftRevision > 0 && draftKey ? loadQualifyDraft(draftKey) : null;
        const revalidationDefault =
          draft?.revalidation_method ?? wpq?.revalidation_method ?? null;
        return (
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
              <Field
                label="Welding process (ISO 4063)"
                required
                error={fieldErrors.process}
                labelAccessory={<Iso9606TablePdfGlobe table="process" />}
              >
                <Select
                  name="process"
                  value={process1}
                  required
                  className={cn(fieldErrors.process && invalidBorder)}
                  onChange={(e) => {
                    setProcess1(e.target.value);
                    clearError("process");
                  }}
                >
                  {WELDING_PROCESSES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} — {p.code}
                    </option>
                  ))}
                </Select>
                {process2 === null ? (
                  <button
                    type="button"
                    onClick={() =>
                      setProcess2(process1 === "141" ? "111" : "141")
                    }
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-ember hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add second process (multi-process)
                  </button>
                ) : null}
              </Field>
              {process2 !== null ? (
                <Field
                  label="Second welding process (ISO 4063)"
                  required
                  error={fieldErrors.process_2}
                  labelAccessory={<Iso9606TablePdfGlobe table="process" />}
                >
                  <div className="flex items-center gap-2">
                    <Select
                      name="process_2"
                      value={process2}
                      required
                      className={cn(
                        "flex-1",
                        fieldErrors.process_2 && invalidBorder,
                      )}
                      onChange={(e) => {
                        setProcess2(e.target.value);
                        clearError("process_2");
                      }}
                    >
                      {WELDING_PROCESSES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name} — {p.code}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => setProcess2(null)}
                      aria-label="Remove second process"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-silver text-steel transition-colors hover:bg-frost hover:text-charcoal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-[12px] text-steel">
                    Multi-process test piece (e.g. 111 + 141). Each process has
                    its own filler details and deposited thickness in Step 2.
                  </p>
                </Field>
              ) : null}
              <PlanProductJointFields
                defaultProduct={wpq?.product ?? "Plate"}
                defaultJoint={defaultJoint}
                defaultBranchConnection={
                  (wpq?.branch_connection as BranchConnection | null) ?? "set_in"
                }
                defaultPosition={draft?.position ?? wpq?.position ?? "PF"}
                productError={fieldErrors.product}
                jointError={fieldErrors.joint_type}
                branchError={fieldErrors.branch_connection}
                positionError={fieldErrors.position}
                onFieldChange={clearError}
                onJointChange={setPlanJoint}
              />
              <SupplementaryFilletFields
                show={planJoint !== "FW"}
                defaultChecked={
                  draft?.supplementary_fillet === "on" ||
                  (wpq?.supplementary_fillet ?? false)
                }
                defaultPosition={
                  draft?.supplementary_fillet_position ??
                  wpq?.supplementary_fillet_position ??
                  "PB"
                }
                defaultThickness={
                  draft?.supplementary_fillet_thickness_mm != null
                    ? Number(draft.supplementary_fillet_thickness_mm)
                    : wpq?.supplementary_fillet_thickness_mm
                }
                processes={process2 ? [process1, process2] : [process1]}
                defaultProcess={wpq?.supplementary_fillet_process ?? process1}
                positionError={fieldErrors.supplementary_fillet_position}
                thicknessError={fieldErrors.supplementary_fillet_thickness_mm}
              />
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
              <Field label="Date of welding" required error={fieldErrors.date_of_welding}>
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
              <Field
                label="Confirmation of revalidation"
                required
                error={fieldErrors.revalidation_method}
                labelAccessory={<Iso9606RevalidationPdfDrawer />}
              >
                <div
                  key={`revalidation-${draftRevision}`}
                  className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:gap-4"
                  role="radiogroup"
                  aria-label="Confirmation of revalidation"
                >
                  {REVALIDATION_METHODS.map((m, index) => (
                    <label
                      key={m.code}
                      className="inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal"
                    >
                      <input
                        type="radio"
                        name="revalidation_method"
                        value={m.code}
                        defaultChecked={
                          revalidationDefault != null &&
                          revalidationDefault === m.code
                        }
                        required={index === 0}
                        className="h-4 w-4 accent-[#f90a08]"
                        onChange={() => clearError("revalidation_method")}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex justify-end">
              <Submit label="Save & continue" icon={Save} />
            </div>
          </CardBody>
        </Card>
        );
      }}
    </ValidatedForm>
  );
}

/** Filler / weld-variable fields for one welding process (prefixed for #2). */
function ProcessDetailFields({
  processCode,
  prefix,
  defaults,
  fieldErrors,
  clearError,
  showTestThickness,
  showDepositedThickness,
  depositedLabel,
}: {
  processCode: string;
  prefix: "" | "process2_";
  defaults: {
    filler_group: string | null;
    filler_designation: string | null;
    filler_type: string | null;
    shielding_gas: string | null;
    current_polarity: string | null;
    transfer_mode: string | null;
    weld_details: string | null;
    test_thickness_mm: number | null;
    deposited_thickness_mm: number | null;
    layer_type: string | null;
  };
  fieldErrors: FieldErrors;
  clearError: (field: string) => void;
  showTestThickness: boolean;
  showDepositedThickness: boolean;
  depositedLabel: string;
}) {
  const n = (base: string) => `${prefix}${base}`;
  const fillerTypeOptions = fillerTypesForProcess(processCode);
  const fillerTypeDefault =
    defaults.filler_type &&
    (fillerTypeOptions as readonly string[]).includes(defaults.filler_type)
      ? defaults.filler_type
      : fillerTypeOptions[0];
  const shieldingDefault =
    normalizeShieldingGas(defaults.shielding_gas) ||
    defaultShieldingGasForProcess(processCode);

  return (
    <>
      <Field
        label="Filler material group"
        required
        error={fieldErrors[n("filler_group")]}
        labelAccessory={<Iso9606TablePdfGlobe table="fillerGroup" />}
      >
        <Select
          name={n("filler_group")}
          defaultValue={defaults.filler_group ?? "FM1"}
          required
          className={cn(fieldErrors[n("filler_group")] && invalidBorder)}
          onChange={() => clearError(n("filler_group"))}
        >
          {FILLER_GROUPS.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Filler designation"
        required
        error={fieldErrors[n("filler_designation")]}
      >
        <Input
          name={n("filler_designation")}
          defaultValue={defaults.filler_designation ?? ""}
          placeholder="ER70S-6 / SFA 5.18"
          required
          className={cn(fieldErrors[n("filler_designation")] && invalidBorder)}
          onChange={() => clearError(n("filler_designation"))}
        />
      </Field>
      <Field
        label="Filler type"
        required
        error={fieldErrors[n("filler_type")]}
        labelAccessory={
          <Iso9606TablePdfGlobe
            table={processCode === "111" ? "fillerType111" : "fillerTypeOther"}
          />
        }
      >
        <Select
          name={n("filler_type")}
          defaultValue={fillerTypeDefault}
          required
          className={cn(fieldErrors[n("filler_type")] && invalidBorder)}
          onChange={() => clearError(n("filler_type"))}
        >
          {fillerTypeOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Shielding gas (ISO 14175)"
        required
        error={fieldErrors[n("shielding_gas")]}
        labelAccessory={<Iso9606TablePdfGlobe table="shieldingGas" />}
      >
        <Select
          name={n("shielding_gas")}
          defaultValue={shieldingDefault}
          required
          className={cn(fieldErrors[n("shielding_gas")] && invalidBorder)}
          onChange={() => clearError(n("shielding_gas"))}
        >
          {SHIELDING_GAS_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Current & polarity"
        required
        error={fieldErrors[n("current_polarity")]}
        labelAccessory={<Iso9606TablePdfGlobe table="currentPolarity" />}
      >
        <Select
          name={n("current_polarity")}
          defaultValue={defaults.current_polarity ?? "DCEP"}
          required
          className={cn(fieldErrors[n("current_polarity")] && invalidBorder)}
          onChange={() => clearError(n("current_polarity"))}
        >
          {CURRENT_POLARITY.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Transfer mode"
        required
        error={fieldErrors[n("transfer_mode")]}
        labelAccessory={<Iso9606TablePdfGlobe table="transferMode" />}
      >
        <Select
          name={n("transfer_mode")}
          defaultValue={defaults.transfer_mode ?? "Spray"}
          required
          className={cn(fieldErrors[n("transfer_mode")] && invalidBorder)}
          onChange={() => clearError(n("transfer_mode"))}
        >
          {TRANSFER_MODE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Weld details"
        required
        error={fieldErrors[n("weld_details")]}
        labelAccessory={<Iso9606TablePdfGlobe table="weldDetails" />}
      >
        <Select
          name={n("weld_details")}
          defaultValue={defaults.weld_details ?? "ss nb"}
          required
          className={cn(fieldErrors[n("weld_details")] && invalidBorder)}
          onChange={() => clearError(n("weld_details"))}
        >
          {WELD_DETAILS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      {showTestThickness ? (
        <Field
          label="Material thickness (mm)"
          required
          error={fieldErrors.test_thickness_mm}
          labelAccessory={<Iso9606TablePdfGlobe table="thicknessFw" />}
        >
          <Input
            type="number"
            step="0.1"
            name="test_thickness_mm"
            defaultValue={defaults.test_thickness_mm ?? ""}
            placeholder="12"
            required
            className={cn(fieldErrors.test_thickness_mm && invalidBorder)}
            onChange={() => clearError("test_thickness_mm")}
          />
        </Field>
      ) : null}
      {showDepositedThickness ? (
        <Field
          label={depositedLabel}
          required
          error={fieldErrors[n("deposited_thickness_mm")]}
          labelAccessory={<Iso9606TablePdfGlobe table="thicknessBw" />}
        >
          <Input
            type="number"
            step="0.1"
            name={n("deposited_thickness_mm")}
            defaultValue={defaults.deposited_thickness_mm ?? ""}
            required
            className={cn(
              fieldErrors[n("deposited_thickness_mm")] && invalidBorder,
            )}
            onChange={() => clearError(n("deposited_thickness_mm"))}
          />
        </Field>
      ) : null}
      <Field
        label="Layer"
        required
        error={fieldErrors[n("layer_type")]}
        labelAccessory={<Iso9606TablePdfGlobe table="layerTechnique" />}
      >
        <Select
          name={n("layer_type")}
          defaultValue={defaults.layer_type ?? LAYER_TYPES[1]}
          required
          className={cn(fieldErrors[n("layer_type")] && invalidBorder)}
          onChange={() => clearError(n("layer_type"))}
        >
          {LAYER_TYPES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

export function TestStep({
  action,
  welderId,
  wpq,
  rangePreview,
  draftStorageKeyOverride,
}: {
  action: (fd: FormData) => void;
  welderId: string;
  wpq: QualificationRecord;
  rangePreview: string | null;
  draftStorageKeyOverride?: string;
}) {
  const jointLabel = displayJointType(wpq);
  const showTestThickness = showTestThicknessField(
    wpq.product,
    wpq.joint_type,
    jointLabel,
  );
  const showDepositedThickness = showDepositedThicknessField(
    wpq.product,
    wpq.joint_type,
    jointLabel,
  );
  const depositedLabel = branchDepositedThicknessLabel(wpq);
  const hasSecondProcess = Boolean(wpq.process_2);

  const validate = useCallback(
    (formData: FormData) =>
      getTestPieceFieldErrors(formData, jointLabel, wpq.product, {
        hasSecondProcess,
        showDepositedThickness,
      }),
    [jointLabel, wpq.product, hasSecondProcess, showDepositedThickness],
  );

  const draftKey =
    draftStorageKeyOverride ?? qualifyDraftKey(welderId, wpq.id, 2);

  return (
    <ValidatedForm
      action={action}
      validate={validate}
      draftStorageKey={draftKey}
      stepNumber={2}
    >
      {({ fieldErrors, clearError, draftRevision }) => {
        const draft =
          draftRevision > 0 ? loadQualifyDraft(draftKey) : null;
        return (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 2 — Test piece record"
              sub="Page 1 continued: materials, dimensions, filler and test piece parameters."
            />
            <MaterialLookupPair
              key={`materials-${draftRevision}`}
              wpq={wpq}
              draft={draft}
              errors={{
                material_standard: fieldErrors.material_standard,
                material_grade: fieldErrors.material_grade,
                base_material_group: fieldErrors.base_material_group,
                material2_specification: fieldErrors.material2_specification,
                material2_grade: fieldErrors.material2_grade,
                material2_group: fieldErrors.material2_group,
              }}
              onFieldChange={clearError}
            />
            {hasSecondProcess ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ProductDimensions
                    product={wpq.product}
                    jointType={jointLabel}
                    wpq={wpq}
                    errors={fieldErrors}
                    onFieldChange={clearError}
                  />
                </div>
                <div className="rounded-[var(--radius-card)] border border-silver bg-frost/30 p-4">
                  <h4 className="mb-3 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-charcoal">
                    Process 1 — {wpq.process}
                  </h4>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ProcessDetailFields
                      processCode={wpq.process}
                      prefix=""
                      defaults={wpq}
                      fieldErrors={fieldErrors}
                      clearError={clearError}
                      showTestThickness={showTestThickness}
                      showDepositedThickness={showDepositedThickness}
                      depositedLabel={depositedLabel}
                    />
                  </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-silver bg-frost/30 p-4">
                  <h4 className="mb-3 font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-charcoal">
                    Process 2 — {wpq.process_2}
                  </h4>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ProcessDetailFields
                      processCode={wpq.process_2 ?? ""}
                      prefix="process2_"
                      defaults={{
                        filler_group: wpq.process2_filler_group,
                        filler_designation: wpq.process2_filler_designation,
                        filler_type: wpq.process2_filler_type,
                        shielding_gas: wpq.process2_shielding_gas,
                        current_polarity: wpq.process2_current_polarity,
                        transfer_mode: wpq.process2_transfer_mode,
                        weld_details: wpq.process2_weld_details,
                        test_thickness_mm: null,
                        deposited_thickness_mm:
                          wpq.process2_deposited_thickness_mm,
                        layer_type: wpq.process2_layer_type,
                      }}
                      fieldErrors={fieldErrors}
                      clearError={clearError}
                      showTestThickness={false}
                      showDepositedThickness={showDepositedThickness}
                      depositedLabel={depositedLabel}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <ProductDimensions
                  product={wpq.product}
                  jointType={jointLabel}
                  wpq={wpq}
                  errors={fieldErrors}
                  onFieldChange={clearError}
                />
                <ProcessDetailFields
                  processCode={wpq.process}
                  prefix=""
                  defaults={wpq}
                  fieldErrors={fieldErrors}
                  clearError={clearError}
                  showTestThickness={showTestThickness}
                  showDepositedThickness={showDepositedThickness}
                  depositedLabel={depositedLabel}
                />
              </div>
            )}

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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <StepPreviousLink welderId={welderId} wpqId={wpq.id} step={2} />
              <Submit label="Save & continue" icon={Save} />
            </div>
          </CardBody>
        </Card>
        );
      }}
    </ValidatedForm>
  );
}

export function NdtStep({
  action,
  welderId,
  wpqId,
  jointType,
  existing,
}: {
  action: (fd: FormData) => void;
  welderId: string;
  wpqId: string;
  jointType: JointCategory;
  existing: NdtDtRecord[];
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    initialSelectedNdtTests(jointType, existing),
  );

  const validate = useCallback(
    (formData: FormData) => getNdtFieldErrors(formData, jointType),
    [jointType],
  );

  function toggleTest(method: string) {
    setSelected((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  const selectedOrdered = ALL_NDT_TESTS.filter((method) =>
    selected.includes(method),
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <Header
              title="Step 3 — NDT / DT results"
              sub="Check the tests you performed — only checked tests need results. Unchecked tests are ignored."
            />

            <div className="rounded-[10px] border border-silver bg-frost/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-charcoal">
                  Tests performed
                </p>
                <Iso9606TablePdfGlobe table="testMethods" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {ALL_NDT_TESTS.map((method) => {
                  const checked = selected.includes(method);

                  return (
                    <label
                      key={method}
                      className="flex cursor-pointer items-center gap-2 text-[14px] text-charcoal"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTest(method)}
                        className="h-4 w-4 accent-[#f90a08]"
                      />
                      {method}
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedOrdered.map((method) => (
              <input
                key={method}
                type="hidden"
                name="selected_method"
                value={method}
              />
            ))}

            {selectedOrdered.length > 0 ? (
              <div className="space-y-3">
                <div className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-steel sm:grid sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr] sm:gap-3">
                  <span>Test</span>
                  <span>Result</span>
                  <span>Test date</span>
                  <span>Report / ref no.</span>
                  <span>Report PDF</span>
                </div>
                {selectedOrdered.map((method) => (
                  <NdtTestRow
                    key={method}
                    method={method}
                    required
                    welderId={welderId}
                    existing={ndtRecordForMethod(existing, method)}
                    fieldErrors={fieldErrors}
                    clearError={clearError}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-graphite">
                Check one or more tests above to enter results.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <StepPreviousLink welderId={welderId} wpqId={wpqId} step={3} />
              <Submit label="Save results" icon={Check} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

function scopedNdtFieldName(scope: string, key: string) {
  return scope ? `${scope}${key}` : key;
}

export function NdtTestRow({
  method,
  required,
  welderId,
  existing,
  compact,
  fieldErrors,
  clearError,
  nameScope = "",
}: {
  method: string;
  required?: boolean;
  welderId: string;
  existing?: NdtDtRecord;
  compact?: boolean;
  fieldErrors: FieldErrors;
  clearError: (key: string) => void;
  nameScope?: string;
}) {
  const resultKey = scopedNdtFieldName(nameScope, `result__${method}`);
  const dateKey = scopedNdtFieldName(nameScope, `test_date__${method}`);
  const refKey = scopedNdtFieldName(nameScope, `conducted_by__${method}`);
  const reportKey = scopedNdtFieldName(nameScope, `report__${method}`);

  return (
    <div
      className={cn(
        "grid items-start gap-3 rounded-[10px]",
        compact
          ? "sm:grid-cols-[0.7fr_0.9fr_1fr_1fr]"
          : "sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr]",
        !compact && "border border-silver bg-frost/50 p-3",
      )}
    >
      {!compact && (
        <div>
          <p className="text-[14px] font-medium text-onyx">
            {method}{" "}
            {required && <span className="text-ember">*</span>}
          </p>
        </div>
      )}
      <Field
        label="Result"
        required={required}
        error={fieldErrors[resultKey]}
        reserveMessageSpace
      >
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
      <Field
        label="Test date"
        required={required}
        error={fieldErrors[dateKey]}
        reserveMessageSpace
      >
        <DatePicker
          name={dateKey}
          defaultValue={existing?.test_date ?? ""}
          required={required}
          error={fieldErrors[dateKey]}
        />
      </Field>
      <Field
        label="Report / ref no."
        required={required}
        error={fieldErrors[refKey]}
        reserveMessageSpace
      >
        <Input
          name={refKey}
          defaultValue={existing?.conducted_by ?? ""}
          placeholder="NDT report no."
          required={required}
          className={cn(fieldErrors[refKey] && invalidBorder)}
          onChange={() => clearError(refKey)}
        />
      </Field>
      <Field label="Report PDF" reserveMessageSpace>
        <div className="flex flex-col gap-1.5">
          {existing?.id && existing.report_pdf_path ? (
            <NdtReportViewer
              welderId={welderId}
              recordId={existing.id}
              testMethod={method}
            />
          ) : null}
          <FileDropzone
            name={reportKey}
            accept="application/pdf,image/*"
            compact
            defaultLabel={
              existing?.report_pdf_path ? "Replace report" : undefined
            }
            placeholder="Drop PDF or click to browse"
          />
        </div>
      </Field>
    </div>
  );
}

export function CertificateStep({
  action,
  welderId,
  wpq,
  rangeSummary,
  ndtReady = false,
}: {
  action: (fd: FormData) => void;
  welderId: string;
  wpq: QualificationRecord;
  rangeSummary: string | null;
  ndtReady?: boolean;
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
              sub="Review the computed range, confirm the date and issue the certificate. The printed certificate is signed by hand."
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
                    wpq.date_of_welding ??
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
              <Field
                label="Job knowledge"
                required
                error={fieldErrors.job_knowledge}
                labelAccessory={<Iso9606TablePdfGlobe table="jobKnowledge" />}
              >
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

            {wpq.supplementary_fillet ? (
              <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-charcoal">
                Supplementary fillet weld test was recorded on the
                qualification plan (Step 1).
              </p>
            ) : null}

            <p className="rounded-[10px] bg-frost px-3 py-2 text-sm text-graphite">
              The certificate leaves a blank examining-body area so it can be
              signed and stamped by hand after printing.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <StepPreviousLink welderId={welderId} wpqId={wpq.id} step={4} />
              <div className="flex flex-wrap items-center gap-3">
                {ndtReady ? (
                  <Badge tone="active">
                    <Check className="h-3.5 w-3.5" /> All selected tests passed
                  </Badge>
                ) : (
                  <Badge tone="expiring">
                    NDT incomplete
                  </Badge>
                )}
                <Submit label="Issue certificate" icon={ShieldCheck} />
              </div>
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
