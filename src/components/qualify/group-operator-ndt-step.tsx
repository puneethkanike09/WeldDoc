"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import {
  GroupStepPreviousLink,
  QualifyHeader,
  QualifySubmit,
  invalidBorder,
} from "@/components/qualify/wizard-chrome";
import { Iso14732TablePdfGlobe } from "@/components/qualify/iso14732-pdf-drawer";
import { OperatorNdtRow } from "@/app/(app)/operators/[id]/qualify/wizard";
import {
  METHOD1_STANDARDS,
  QUALIFICATION_TEST_METHODS,
  requiredNdtTests,
} from "@/lib/iso14732/constants";
import { getOperatorNdtFieldErrors, ndtRecordForMethod } from "@/lib/iso14732/qualification-fields";
import type { OperatorNdtRecord, OperatorQualification } from "@/types/db";
import { ValidatedForm } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface GroupOperatorNdtMember {
  memberId: string;
  personName: string;
  plantId: string | null;
  operatorId: string;
  qualificationId: string | null;
  existingNdt: OperatorNdtRecord[];
}

export function GroupOperatorNdtStep({
  action,
  baseHref,
  planContext,
  members,
  defaultMethod,
  defaultMethod1Standard,
}: {
  action: (fd: FormData) => void;
  baseHref: string;
  planContext: Pick<
    OperatorQualification,
    | "welding_type"
    | "product_type"
    | "joint_type"
    | "process"
    | "qualification_test_method"
    | "method1_standard"
  >;
  members: GroupOperatorNdtMember[];
  defaultMethod?: string;
  defaultMethod1Standard?: string;
}) {
  const [ndtMethod, setNdtMethod] = useState(
    defaultMethod ?? planContext.qualification_test_method ?? "",
  );
  const [method1Standard, setMethod1Standard] = useState(
    defaultMethod1Standard ?? planContext.method1_standard ?? "",
  );

  const ndtTests = useMemo(
    () =>
      requiredNdtTests({
        qualification_test_method:
          ndtMethod as OperatorQualification["qualification_test_method"],
        method1_standard: method1Standard,
        welding_type: planContext.welding_type,
        product_type: planContext.product_type,
        joint_type: planContext.joint_type,
        process: planContext.process,
      }),
    [ndtMethod, method1Standard, planContext],
  );

  const validate = useCallback(
    (formData: FormData) => {
      const sharedErrors = getOperatorNdtFieldErrors(formData, {
        ...planContext,
        qualification_test_method: formData.get(
          "qualification_test_method",
        ) as OperatorQualification["qualification_test_method"],
        method1_standard: String(formData.get("method1_standard") ?? ""),
      });
      const errors: FieldErrors = { ...sharedErrors };
      const tests = requiredNdtTests({
        ...planContext,
        qualification_test_method: formData.get(
          "qualification_test_method",
        ) as OperatorQualification["qualification_test_method"],
        method1_standard: String(formData.get("method1_standard") ?? ""),
      });
      for (const member of members) {
        if (!member.qualificationId) continue;
        const scope = `member_${member.memberId}_`;
        for (const t of tests) {
          const resultKey = `${scope}ndt_${t.method}`;
          const dateKey = `${scope}test_date__${t.method}`;
          const refKey = `${scope}conducted_by__${t.method}`;
          const val = String(formData.get(resultKey) ?? "");
          if (!val || !["Pass", "Fail", "NA"].includes(val)) {
            errors[resultKey] = `${t.label} result is required.`;
          }
          if (!String(formData.get(dateKey) ?? "").trim()) {
            errors[dateKey] = `${t.label} test date is required.`;
          }
          if (!String(formData.get(refKey) ?? "").trim()) {
            errors[refKey] = `${t.label} report / reference no. is required.`;
          }
        }
      }
      return errors;
    },
    [members, planContext],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHeader
              title="Step 3 — NDT / DT results"
              sub="Select the qualification test method and record results for each required test per operator."
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
              <div className="space-y-5">
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
                {members.map((member) => (
                  <div key={member.memberId} className="space-y-3">
                    <p className="px-3 font-display text-sm font-semibold text-onyx">
                      {member.personName}
                      {member.plantId ? (
                        <span className="ml-2 font-mono text-xs font-normal text-steel">
                          {member.plantId}
                        </span>
                      ) : null}
                    </p>
                    {!member.qualificationId ? (
                      <p className="mx-3 rounded-[10px] bg-expiring/15 px-4 py-3 text-sm text-[#8a6a00]">
                        Qualification record missing for this operator. Go back to
                        step 1, save the plan again, then complete step 2 before
                        entering NDT results.
                      </p>
                    ) : (
                      ndtTests.map((t) => (
                        <OperatorNdtRow
                          key={`${member.memberId}-${t.method}`}
                          label={t.label}
                          method={t.method}
                          operatorId={member.operatorId}
                          existing={ndtRecordForMethod(member.existingNdt, t.method)}
                          fieldErrors={fieldErrors}
                          clearError={clearError}
                          nameScope={`member_${member.memberId}_`}
                        />
                      ))
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-graphite">
                Select a qualification test method to see required tests.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <GroupStepPreviousLink baseHref={baseHref} step={3} />
              <QualifySubmit label="Save results" icon={Check} />
            </div>
          </CardBody>
        </Card>
      )}
    </ValidatedForm>
  );
}
