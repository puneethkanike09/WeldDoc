"use client";

import { useCallback, useMemo, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/file-dropzone";
import {
  QualifyHiddenIds,
  QualifyHeader,
  QualifyStepPreviousLink,
  QualifySubmit,
  RangePreviewBox,
  invalidBorder,
} from "@/components/qualify/wizard-chrome";
import { WELDING_PROCESSES } from "@/lib/iso9606/constants";
import {
  BACKING_TYPES,
  METHOD1_STANDARDS,
  ORBITAL_POSITION_OPTIONS,
  QUALIFICATION_TEST_METHODS,
  REVALIDATION_METHODS,
  SINGLE_MULTI_OPTIONS,
  TECHNOLOGY_KNOWLEDGE,
  TESTING_STANDARD,
  VISUAL_REMOTE_OPTIONS,
  WELDING_MODES,
  WELDING_TYPES,
  YES_NO_NA_OPTIONS,
  YES_NO_OPTIONS,
  jointTypesFor,
  productTypesFor,
  requiredNdtTests,
  showAutomaticFields,
  showMechanizedFields,
} from "@/lib/iso14732/constants";
import {
  getOperatorNdtFieldErrors,
  getOperatorPlanFieldErrors,
  getOperatorTestPieceFieldErrors,
  getOperatorCertificateIssueFieldErrors,
  ndtRecordForMethod,
} from "@/lib/iso14732/qualification-fields";
import { NdtReportViewer } from "@/components/qualify/ndt-report-viewer";
import {
  Iso14732RevalidationPdfDrawer,
  Iso14732TablePdfGlobe,
} from "@/components/qualify/iso14732-pdf-drawer";
import type { FieldErrors } from "@/lib/field-errors";
import type {
  Operator,
  OperatorNdtRecord,
  OperatorQualification,
  OperatorWeldingMode,
  OperatorWeldingType,
} from "@/types/db";
import { cn } from "@/lib/utils";
import { ValidatedForm } from "@/lib/form-toast";
import {
  loadQualifyDraft,
  operatorQualifyDraftKey,
} from "@/lib/qualify/wizard-draft";
import { Check, Save, ShieldCheck } from "lucide-react";

export function OperatorPlanStep({
  action,
  oq,
  operator,
  orgName,
  orgLocation,
  draftStorageKeyOverride,
}: {
  action: (fd: FormData) => void;
  oq: OperatorQualification | null;
  operator: Operator;
  orgName: string;
  orgLocation: string | null;
  draftStorageKeyOverride?: string;
}) {
  const [weldingType, setWeldingType] = useState<OperatorWeldingType | "">(
    oq?.welding_type ?? "",
  );
  const [weldingMode, setWeldingMode] = useState<OperatorWeldingMode | "">(
    oq?.welding_mode ?? "",
  );

  const products = useMemo(
    () => productTypesFor(weldingType || null),
    [weldingType],
  );
  const joints = useMemo(
    () => jointTypesFor(weldingType || null),
    [weldingType],
  );

  const validate = useCallback(
    (formData: FormData) => getOperatorPlanFieldErrors(formData),
    [],
  );

  const draftKey =
    draftStorageKeyOverride ??
    (oq?.id ? operatorQualifyDraftKey(operator.id, oq.id, 1) : null);

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
          draft?.revalidation_method ?? oq?.revalidation_method ?? "6.3b";

        return (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHiddenIds operatorId={operator.id} oqId={oq?.id} />
            <QualifyHeader
              title="Step 1 — Qualification plan"
              sub="Standard, process, WPS, examiner and revalidation method per ISO 14732:2025."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Code / testing standard">
                <Input value={TESTING_STANDARD} disabled />
              </Field>
              <Field
                label="Date of welding"
                required
                error={fieldErrors.date_of_welding}
              >
                <DatePicker
                  name="date_of_welding"
                  defaultValue={oq?.date_of_welding ?? ""}
                  required
                  error={fieldErrors.date_of_welding}
                />
              </Field>
              <Field
                label="Type of welding"
                required
                error={fieldErrors.welding_type}
                labelAccessory={<Iso14732TablePdfGlobe table="qualification" />}
              >
                <Select
                  name="welding_type"
                  value={weldingType}
                  required
                  className={cn(fieldErrors.welding_type && invalidBorder)}
                  onChange={(e) => {
                    setWeldingType(e.target.value as OperatorWeldingType);
                    clearError("welding_type");
                  }}
                >
                  <option value="">Select…</option>
                  {WELDING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Welding process (ISO 4063)"
                required
                error={fieldErrors.process}
                labelAccessory={<Iso14732TablePdfGlobe table="process" />}
              >
                <Select
                  name="process"
                  defaultValue={oq?.process ?? ""}
                  required
                  className={cn(fieldErrors.process && invalidBorder)}
                  onChange={() => clearError("process")}
                >
                  <option value="">Select…</option>
                  {WELDING_PROCESSES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} — {p.code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Product type"
                required
                error={fieldErrors.product_type}
                labelAccessory={<Iso14732TablePdfGlobe table="productJoint" />}
              >
                <Select
                  name="product_type"
                  defaultValue={oq?.product_type ?? ""}
                  required
                  className={cn(fieldErrors.product_type && invalidBorder)}
                  onChange={() => clearError("product_type")}
                >
                  <option value="">Select…</option>
                  {products.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Joint type"
                required
                error={fieldErrors.joint_type}
                labelAccessory={<Iso14732TablePdfGlobe table="productJoint" />}
              >
                <Select
                  name="joint_type"
                  defaultValue={oq?.joint_type ?? ""}
                  required
                  className={cn(fieldErrors.joint_type && invalidBorder)}
                  onChange={() => clearError("joint_type")}
                >
                  <option value="">Select…</option>
                  {joints.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Mode of welding"
                required
                error={fieldErrors.welding_mode}
                labelAccessory={<Iso14732TablePdfGlobe table="weldingMode" />}
              >
                <Select
                  name="welding_mode"
                  value={weldingMode}
                  required
                  className={cn(fieldErrors.welding_mode && invalidBorder)}
                  onChange={(e) => {
                    setWeldingMode(e.target.value as OperatorWeldingMode);
                    clearError("welding_mode");
                  }}
                >
                  <option value="">Select…</option>
                  {WELDING_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="WPS reference"
                required
                error={fieldErrors.wps_reference}
              >
                <Input
                  name="wps_reference"
                  defaultValue={oq?.wps_reference ?? ""}
                  placeholder="ACME/PLT-A/QA/WPS-075 REV-02"
                  required
                  className={cn(fieldErrors.wps_reference && invalidBorder)}
                  onChange={() => clearError("wps_reference")}
                />
              </Field>
              <Field label="Employer">
                <Input name="employer_display" value={orgName} disabled />
              </Field>
              <Field label="Branch / site" required error={fieldErrors.employer_branch}>
                <Input
                  name="employer_branch"
                  defaultValue={oq?.employer_branch ?? operator.branch_location ?? orgLocation ?? ""}
                  required
                  className={cn(fieldErrors.employer_branch && invalidBorder)}
                  onChange={() => clearError("employer_branch")}
                />
              </Field>
              <Field
                label="Functional knowledge test ref"
                required
                error={fieldErrors.functional_knowledge_ref}
                labelAccessory={
                  <Iso14732TablePdfGlobe table="functionalKnowledge" />
                }
              >
                <Input
                  name="functional_knowledge_ref"
                  defaultValue={oq?.functional_knowledge_ref ?? ""}
                  required
                  className={cn(fieldErrors.functional_knowledge_ref && invalidBorder)}
                  onChange={() => clearError("functional_knowledge_ref")}
                />
              </Field>
              <Field
                label="Welding technology knowledge"
                required
                error={fieldErrors.welding_technology_knowledge}
                labelAccessory={
                  <Iso14732TablePdfGlobe table="technologyKnowledge" />
                }
              >
                <Select
                  name="welding_technology_knowledge"
                  defaultValue={oq?.welding_technology_knowledge ?? ""}
                  required
                  className={cn(
                    fieldErrors.welding_technology_knowledge && invalidBorder,
                  )}
                  onChange={() => clearError("welding_technology_knowledge")}
                >
                  <option value="">Select…</option>
                  {TECHNOLOGY_KNOWLEDGE.map((k) => (
                    <option key={k} value={k}>
                      {k.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Examiner / body reference"
                required
                error={fieldErrors.examiner_ref}
              >
                <Input
                  name="examiner_ref"
                  defaultValue={oq?.examiner_ref ?? ""}
                  placeholder="Third-party examiner ref."
                  required
                  className={cn(fieldErrors.examiner_ref && invalidBorder)}
                  onChange={() => clearError("examiner_ref")}
                />
              </Field>
              <Field
                label="Examiner / examining body name"
                required
                error={fieldErrors.examiner_name}
              >
                <Input
                  name="examiner_name"
                  defaultValue={oq?.examiner_name ?? ""}
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
                className="sm:col-span-2"
                labelAccessory={<Iso14732RevalidationPdfDrawer />}
              >
                <div
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
                        defaultChecked={revalidationDefault === m.code}
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
              <QualifySubmit label="Save & continue" icon={Save} />
            </div>
          </CardBody>
        </Card>
        );
      }}
    </ValidatedForm>
  );
}

export function OperatorTestStep({
  action,
  operatorId,
  oq,
  rangePreview,
  draftStorageKeyOverride,
}: {
  action: (fd: FormData) => void;
  operatorId: string;
  oq: OperatorQualification;
  rangePreview: string | null;
  draftStorageKeyOverride?: string;
}) {
  const [backing, setBacking] = useState(oq.material_backing ?? "");
  const weldingMode = oq.welding_mode;

  const validate = useCallback(
    (formData: FormData) =>
      getOperatorTestPieceFieldErrors(formData, weldingMode),
    [weldingMode],
  );

  const qualifyHref = `/operators/${operatorId}/qualify`;
  const draftKey =
    draftStorageKeyOverride ?? operatorQualifyDraftKey(operatorId, oq.id, 2);

  return (
    <ValidatedForm
      action={action}
      validate={validate}
      draftStorageKey={draftKey}
      stepNumber={2}
    >
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHiddenIds operatorId={operatorId} oqId={oq.id} />
            <QualifyHeader
              title="Step 2 — Test piece"
              sub="Equipment details and test-piece parameters that define the certificate range."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Welding equipment (power source)"
                required
                error={fieldErrors.equipment_power_source}
                className="sm:col-span-2"
                labelAccessory={<Iso14732TablePdfGlobe table="weldingEquipment" />}
              >
                <Input
                  name="equipment_power_source"
                  defaultValue={oq.equipment_power_source ?? ""}
                  required
                  className={cn(fieldErrors.equipment_power_source && invalidBorder)}
                  onChange={() => clearError("equipment_power_source")}
                />
              </Field>
              <Field
                label="Welding unit details"
                required
                error={fieldErrors.equipment_unit_details}
                className="sm:col-span-2"
                labelAccessory={<Iso14732TablePdfGlobe table="weldingUnit" />}
              >
                <Textarea
                  name="equipment_unit_details"
                  defaultValue={oq.equipment_unit_details ?? ""}
                  required
                  className={cn(fieldErrors.equipment_unit_details && invalidBorder)}
                  onChange={() => clearError("equipment_unit_details")}
                />
              </Field>
            </div>

            {showMechanizedFields(weldingMode) && (
              <div className="grid gap-5 border-t border-silver pt-5 sm:grid-cols-2">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-steel sm:col-span-2">
                  <span className="inline-flex items-center gap-1.5">
                    Mechanized welding parameters
                    <Iso14732TablePdfGlobe table="mechanizedVariables" />
                  </span>
                </p>
                <Field
                  label="Visual / Remote control"
                  required
                  error={fieldErrors.visual_or_remote_control}
                >
                  <Select
                    name="visual_or_remote_control"
                    defaultValue={oq.visual_or_remote_control ?? ""}
                    required
                    className={cn(
                      fieldErrors.visual_or_remote_control && invalidBorder,
                    )}
                    onChange={() => clearError("visual_or_remote_control")}
                  >
                    <option value="">Select…</option>
                    {VISUAL_REMOTE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Automatic joint tracking"
                  required
                  error={fieldErrors.automatic_joint_tracking}
                >
                  <Select
                    name="automatic_joint_tracking"
                    defaultValue={oq.automatic_joint_tracking ?? ""}
                    required
                    className={cn(
                      fieldErrors.automatic_joint_tracking && invalidBorder,
                    )}
                    onChange={() => clearError("automatic_joint_tracking")}
                  >
                    <option value="">Select…</option>
                    {YES_NO_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Automatic arc length control"
                  required
                  error={fieldErrors.automatic_arc_length_control}
                >
                  <Select
                    name="automatic_arc_length_control"
                    defaultValue={oq.automatic_arc_length_control ?? ""}
                    required
                    className={cn(
                      fieldErrors.automatic_arc_length_control && invalidBorder,
                    )}
                    onChange={() => clearError("automatic_arc_length_control")}
                  >
                    <option value="">Select…</option>
                    {YES_NO_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Single / Multi run"
                  required
                  error={fieldErrors.single_multi_run}
                >
                  <Select
                    name="single_multi_run"
                    defaultValue={oq.single_multi_run ?? ""}
                    required
                    className={cn(fieldErrors.single_multi_run && invalidBorder)}
                    onChange={() => clearError("single_multi_run")}
                  >
                    <option value="">Select…</option>
                    {SINGLE_MULTI_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Orbital welding position"
                  required
                  error={fieldErrors.orbital_position}
                >
                  <Select
                    name="orbital_position"
                    defaultValue={oq.orbital_position ?? ""}
                    required
                    className={cn(fieldErrors.orbital_position && invalidBorder)}
                    onChange={() => clearError("orbital_position")}
                  >
                    <option value="">Select…</option>
                    {ORBITAL_POSITION_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Material backing"
                  required
                  error={fieldErrors.material_backing}
                >
                  <Select
                    name="material_backing"
                    value={backing}
                    required
                    className={cn(fieldErrors.material_backing && invalidBorder)}
                    onChange={(e) => {
                      setBacking(e.target.value);
                      clearError("material_backing");
                    }}
                  >
                    <option value="">Select…</option>
                    {YES_NO_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
                {backing === "Yes" && (
                  <Field
                    label="Backing type"
                    required
                    error={fieldErrors.material_backing_type}
                  >
                    <Select
                      name="material_backing_type"
                      defaultValue={oq.material_backing_type ?? ""}
                      required
                      className={cn(
                        fieldErrors.material_backing_type && invalidBorder,
                      )}
                      onChange={() => clearError("material_backing_type")}
                    >
                      <option value="">Select…</option>
                      {BACKING_TYPES.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field
                  label="Consumable insert"
                  required
                  error={fieldErrors.consumable_insert}
                >
                  <Select
                    name="consumable_insert"
                    defaultValue={oq.consumable_insert ?? ""}
                    required
                    className={cn(fieldErrors.consumable_insert && invalidBorder)}
                    onChange={() => clearError("consumable_insert")}
                  >
                    <option value="">Select…</option>
                    {YES_NO_NA_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            {showAutomaticFields(weldingMode) &&
              !showMechanizedFields(weldingMode) && (
                <Field
                  label="Single / Multi run (weld setters)"
                  required
                  error={fieldErrors.single_multi_run}
                  labelAccessory={
                    <Iso14732TablePdfGlobe table="automaticVariables" />
                  }
                >
                  <Select
                    name="single_multi_run"
                    defaultValue={oq.single_multi_run ?? ""}
                    required
                    className={cn(fieldErrors.single_multi_run && invalidBorder)}
                    onChange={() => clearError("single_multi_run")}
                  >
                    <option value="">Select…</option>
                    {SINGLE_MULTI_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

            <div className="grid gap-5 border-t border-silver pt-5 sm:grid-cols-2">
              <p className="text-[13px] font-medium text-charcoal sm:col-span-2">
                For information only (optional)
              </p>
              <Field label="Material specification / grade / group">
                <Input
                  name="material_spec_info"
                  defaultValue={oq.material_spec_info ?? ""}
                />
              </Field>
              <Field label="Test piece dimensions">
                <Input
                  name="test_piece_dimensions_info"
                  defaultValue={oq.test_piece_dimensions_info ?? ""}
                />
              </Field>
              <Field
                label="Filler material designation"
                className="sm:col-span-2"
              >
                <Input
                  name="filler_designation_info"
                  defaultValue={oq.filler_designation_info ?? ""}
                />
              </Field>
            </div>

            {rangePreview ? <RangePreviewBox summary={rangePreview} /> : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <QualifyStepPreviousLink
                qualifyHref={qualifyHref}
                recordId={oq.id}
                step={2}
              />
              <QualifySubmit label="Save & continue" icon={Save} />
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

export function OperatorNdtRow({
  label,
  method,
  operatorId,
  existing,
  fieldErrors,
  clearError,
  nameScope = "",
}: {
  label: string;
  method: string;
  operatorId: string;
  existing?: OperatorNdtRecord;
  fieldErrors: FieldErrors;
  clearError: (key: string) => void;
  nameScope?: string;
}) {
  const resultKey = scopedNdtFieldName(nameScope, `ndt_${method}`);
  const dateKey = scopedNdtFieldName(nameScope, `test_date__${method}`);
  const refKey = scopedNdtFieldName(nameScope, `conducted_by__${method}`);
  const reportKey = scopedNdtFieldName(nameScope, `report__${method}`);

  return (
    <div className="grid items-start gap-3 rounded-[10px] border border-silver bg-frost/50 p-3 sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr]">
      <div>
        <p className="text-[14px] font-medium text-onyx">
          {label} <span className="text-ember">*</span>
        </p>
      </div>
      <Field
        label="Result"
        required
        error={fieldErrors[resultKey]}
        reserveMessageSpace
      >
        <Select
          name={resultKey}
          defaultValue={existing?.result ?? "Pass"}
          required
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
        required
        error={fieldErrors[dateKey]}
        reserveMessageSpace
      >
        <DatePicker
          name={dateKey}
          defaultValue={existing?.test_date ?? ""}
          required
          error={fieldErrors[dateKey]}
        />
      </Field>
      <Field
        label="Report / ref no."
        required
        error={fieldErrors[refKey]}
        reserveMessageSpace
      >
        <Input
          name={refKey}
          defaultValue={existing?.conducted_by ?? ""}
          placeholder="NDT report no."
          required
          className={cn(
            fieldErrors[refKey] && invalidBorder,
          )}
          onChange={() => clearError(refKey)}
        />
      </Field>
      <Field label="Report PDF" reserveMessageSpace>
        <div className="flex flex-col gap-1.5">
          {existing?.id && existing.report_pdf_path ? (
            <NdtReportViewer
              reportSrc={`/api/operators/${operatorId}/ndt/${existing.id}/report`}
              testMethod={label}
            />
          ) : null}
          <FileDropzone
            name={reportKey}
            accept="application/pdf,image/*"
            compact
            defaultLabel={
              existing?.report_pdf_path ? "Replace report" : undefined
            }
          />
        </div>
      </Field>
    </div>
  );
}

export function OperatorNdtStep({
  action,
  operatorId,
  oq,
  ndt,
}: {
  action: (fd: FormData) => void;
  operatorId: string;
  oq: OperatorQualification;
  ndt: OperatorNdtRecord[];
}) {
  const [ndtMethod, setNdtMethod] = useState(
    oq.qualification_test_method ?? "",
  );
  const [method1Standard, setMethod1Standard] = useState(
    oq.method1_standard ?? "",
  );

  const ndtTests = useMemo(
    () =>
      requiredNdtTests({
        qualification_test_method:
          ndtMethod as OperatorQualification["qualification_test_method"],
        method1_standard: method1Standard,
        welding_type: oq.welding_type,
        product_type: oq.product_type,
        joint_type: oq.joint_type,
        process: oq.process,
      }),
    [ndtMethod, method1Standard, oq],
  );

  const validate = useCallback(
    (formData: FormData) =>
      getOperatorNdtFieldErrors(formData, {
        ...oq,
        qualification_test_method: formData.get(
          "qualification_test_method",
        ) as OperatorQualification["qualification_test_method"],
        method1_standard: formData.get("method1_standard") as string,
      }),
    [oq],
  );

  const qualifyHref = `/operators/${operatorId}/qualify`;

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHiddenIds operatorId={operatorId} oqId={oq.id} />
            <QualifyHeader
              title="Step 3 — NDT / DT results"
              sub="Select the qualification test method and record results for each required test."
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Qualification test method"
                required
                error={fieldErrors.qualification_test_method}
                labelAccessory={
                  <Iso14732TablePdfGlobe table="qualificationTestMethods" />
                }
              >
                <Select
                  name="qualification_test_method"
                  value={ndtMethod}
                  required
                  className={cn(
                    fieldErrors.qualification_test_method && invalidBorder,
                  )}
                  onChange={(e) => {
                    setNdtMethod(e.target.value);
                    clearError("qualification_test_method");
                  }}
                >
                  <option value="">Select…</option>
                  {QUALIFICATION_TEST_METHODS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {ndtMethod === "Method_1" && (
                <Field
                  label="ISO 9606 standard"
                  required
                  error={fieldErrors.method1_standard}
                >
                  <Select
                    name="method1_standard"
                    value={method1Standard}
                    required
                    className={cn(fieldErrors.method1_standard && invalidBorder)}
                    onChange={(e) => {
                      setMethod1Standard(e.target.value);
                      clearError("method1_standard");
                    }}
                  >
                    <option value="">Select…</option>
                    {METHOD1_STANDARDS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>

            {ndtTests.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-end px-3 sm:hidden">
                  <Iso14732TablePdfGlobe table="qualificationTestMethods" />
                </div>
                <div className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-steel sm:grid sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr] sm:gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    Test
                    <Iso14732TablePdfGlobe table="qualificationTestMethods" />
                  </span>
                  <span>Result</span>
                  <span>Test date</span>
                  <span>Report / ref no.</span>
                  <span>Report PDF</span>
                </div>
                {ndtTests.map((t) => (
                  <OperatorNdtRow
                    key={t.method}
                    label={t.label}
                    method={t.method}
                    operatorId={operatorId}
                    existing={ndtRecordForMethod(ndt, t.method)}
                    fieldErrors={fieldErrors}
                    clearError={clearError}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-graphite">
                Select a qualification test method to see required tests.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <QualifyStepPreviousLink
                qualifyHref={qualifyHref}
                recordId={oq.id}
                step={3}
              />
              <QualifySubmit label="Save results" icon={Check} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}

export function OperatorCertificateStep({
  action,
  operatorId,
  oq,
  rangeSummary,
  ndtReady = false,
}: {
  action: (fd: FormData) => void;
  operatorId: string;
  oq: OperatorQualification;
  rangeSummary: string | null;
  ndtReady?: boolean;
}) {
  const qualifyHref = `/operators/${operatorId}/qualify`;
  const validate = useCallback(
    (formData: FormData) => getOperatorCertificateIssueFieldErrors(formData),
    [],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHiddenIds operatorId={operatorId} oqId={oq.id} />
            <QualifyHeader
              title="Step 4 — Generate certificate"
              sub="Review the computed range, confirm the date and issue the certificate. The printed certificate is signed by hand."
            />

            <div className="rounded-[10px] bg-frost p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite">
                  Computed range of qualification
                </p>
                <Iso14732TablePdfGlobe table="certificate" />
              </div>
              <p className="mt-1 text-[14px] text-charcoal">
                {rangeSummary ?? "—"}
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
                    oq.certificate_issued_date ??
                    oq.date_of_welding ??
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
                  defaultValue={oq.examiner_name ?? ""}
                  placeholder="Examiner / examining body"
                  required
                  className={cn(fieldErrors.examiner_name && invalidBorder)}
                  onChange={() => clearError("examiner_name")}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <QualifyStepPreviousLink
                qualifyHref={qualifyHref}
                recordId={oq.id}
                step={4}
              />
              <div className="flex flex-wrap items-center gap-3">
                {ndtReady ? (
                  <Badge tone="active">
                    <Check className="h-3.5 w-3.5" /> All required tests passed
                  </Badge>
                ) : (
                  <Badge tone="expiring">NDT incomplete</Badge>
                )}
                <QualifySubmit label="Issue certificate" icon={ShieldCheck} />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}
