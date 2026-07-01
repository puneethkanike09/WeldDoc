"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import {
  GroupStepPreviousLink,
  QualifyHeader,
  QualifySubmit,
} from "@/components/qualify/wizard-chrome";
import { Iso9606TablePdfGlobe } from "@/components/qualify/iso9606-pdf-drawer";
import { NdtTestRow } from "@/app/(app)/welders/[id]/qualify/wizard";
import { ALL_NDT_TESTS } from "@/lib/iso9606/constants";
import {
  initialSelectedNdtTests,
  ndtJointCategory,
  ndtRecordForMethod,
} from "@/lib/iso9606/qualification-fields";
import type { JointCategory, NdtDtRecord } from "@/types/db";
import { ValidatedForm } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import { Check } from "lucide-react";

export interface GroupNdtMember {
  memberId: string;
  personName: string;
  plantId: string | null;
  welderId: string;
  existingNdt: NdtDtRecord[];
}

export function GroupWelderNdtStep({
  action,
  baseHref,
  jointLabel,
  members,
  defaultMethods,
}: {
  action: (fd: FormData) => void;
  baseHref: string;
  jointLabel: string;
  members: GroupNdtMember[];
  defaultMethods?: string[];
}) {
  const jointCategory = ndtJointCategory(jointLabel) as JointCategory;
  const allExisting = useMemo(
    () => members.flatMap((m) => m.existingNdt),
    [members],
  );

  const [selected, setSelected] = useState<string[]>(() => {
    if (defaultMethods?.length) {
      return ALL_NDT_TESTS.filter((method) => defaultMethods.includes(method));
    }
    return initialSelectedNdtTests(jointCategory, allExisting);
  });

  const toggle = (method: string) => {
    setSelected((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  };

  const selectedOrdered = ALL_NDT_TESTS.filter((method) =>
    selected.includes(method),
  );

  const validate = useCallback(
    (formData: FormData) => {
      const errors: FieldErrors = {};
      const methods = formData
        .getAll("selected_method")
        .map(String)
        .filter(Boolean);
      if (!methods.length) {
        errors.selected_method = "Select at least one test.";
        return errors;
      }
      for (const member of members) {
        const scope = `member_${member.memberId}_`;
        for (const method of methods) {
          const resultKey = `${scope}result__${method}`;
          const dateKey = `${scope}test_date__${method}`;
          const refKey = `${scope}conducted_by__${method}`;
          const result = String(formData.get(resultKey) ?? "");
          if (!result || result === "NA") {
            errors[resultKey] = `${method}: select Pass or Fail.`;
          }
          if (!String(formData.get(dateKey) ?? "").trim()) {
            errors[dateKey] = `${method} test date is required.`;
          }
          if (!String(formData.get(refKey) ?? "").trim()) {
            errors[refKey] = `${method} report / reference no. is required.`;
          }
        }
      }
      return errors;
    },
    [members],
  );

  return (
    <ValidatedForm action={action} validate={validate}>
      {({ fieldErrors, clearError }) => (
        <Card>
          <CardBody className="space-y-5">
            <QualifyHeader
              title="Step 3 — NDT / DT results"
              sub="Check the tests you performed — only checked tests need results. Unchecked tests are ignored. Enter Pass/Fail per welder for each selected test."
            />

            <div className="rounded-[10px] border border-silver bg-frost/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-charcoal">
                  Tests performed
                </p>
                <Iso9606TablePdfGlobe table="testMethods" />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {ALL_NDT_TESTS.map((method) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center gap-2 text-[14px] text-charcoal"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(method)}
                      onChange={() => toggle(method)}
                      className="h-4 w-4 accent-[#f90a08]"
                    />
                    {method}
                  </label>
                ))}
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

            {selectedOrdered.length > 0 && members.length > 0 ? (
              <div className="space-y-5">
                <div className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-steel sm:grid sm:grid-cols-[1.1fr_0.7fr_0.9fr_1fr_1fr] sm:gap-3">
                  <span>Test</span>
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
                    {selectedOrdered.map((method) => (
                      <NdtTestRow
                        key={`${member.memberId}-${method}`}
                        method={method}
                        required
                        welderId={member.welderId}
                        existing={ndtRecordForMethod(member.existingNdt, method)}
                        fieldErrors={fieldErrors}
                        clearError={clearError}
                        nameScope={`member_${member.memberId}_`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-[10px] bg-frost px-4 py-3 text-sm text-graphite">
                Check one or more tests above to enter results.
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
