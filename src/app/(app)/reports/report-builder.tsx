"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  WELDING_PROCESSES,
  PRODUCT_TYPES,
  BW_POSITIONS,
  FW_POSITIONS,
  MATERIAL_GROUPS,
} from "@/lib/iso9606/constants";
import { collectReportFormErrors } from "@/lib/reports/validate-report-rows";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import type { JointCategory, ProductType, Signatory } from "@/types/db";
import { FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";

const invalidBorder = "border-ember ring-1 ring-ember/20";

interface WelderOption {
  id: string;
  full_name: string;
  welder_id: string | null;
  is_new_welder: boolean;
}

interface Row {
  key: string;
  welderId: string;
  process: string;
  product: ProductType;
  position: string;
  materialGroup: string;
  materialGrade: string;
  dimensions: string;
  testThickness: string;
  pipeOd: string;
  visualResult: "Pass" | "Fail";
  mainResult: "Pass" | "Fail" | "NA";
}

function newRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    welderId: "",
    process: "135",
    product: "Plate",
    position: "PF",
    materialGroup: "1",
    materialGrade: "",
    dimensions: "",
    testThickness: "",
    pipeOd: "",
    visualResult: "Pass",
    mainResult: "Pass",
  };
}

function Submit({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FilePlus2 className="h-4 w-4" />
      )}
      Create report &amp; qualify welders
    </Button>
  );
}

export function ReportBuilder({
  action,
  welders,
  signatories,
}: {
  action: (fd: FormData) => Promise<void>;
  welders: WelderOption[];
  signatories: Signatory[];
}) {
  const [category, setCategory] = useState<JointCategory>("BW");
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const manufacturers = signatories.filter((s) => s.role === "manufacturer");
  const examiners = signatories.filter((s) => s.role === "examining_body");
  const positions = category === "FW" ? FW_POSITIONS : BW_POSITIONS;

  const serialized = useMemo(
    () =>
      JSON.stringify(
        rows
          .filter((r) => r.welderId)
          .map((r) => ({
            welderId: r.welderId,
            process: r.process,
            product: r.product,
            position: r.position,
            materialGroup: r.materialGroup,
            materialGrade: r.materialGrade,
            dimensions: r.dimensions,
            testThickness: r.testThickness ? Number(r.testThickness) : null,
            pipeOd: r.pipeOd ? Number(r.pipeOd) : null,
            visualResult: r.visualResult,
            mainResult: r.mainResult,
          })),
      ),
    [rows],
  );

  function update(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validate = useCallback(
    (formData: FormData) => {
      const errors = collectReportFormErrors(
        formData,
        rows.map((r) => ({
          key: r.key,
          welderId: r.welderId,
          materialGrade: r.materialGrade,
          dimensions: r.dimensions,
          testThickness: r.testThickness,
        })),
      );
      setFieldErrors(errors);
      return errors;
    },
    [rows],
  );

  const { onSubmit, pending } = useFormSubmit(action, validate);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="rows" value={serialized} />

      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Test session
          </h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Joint category" hint="BW and FW are separate sheets" required>
              <Select
                name="joint_category"
                value={category}
                required
                onChange={(e) =>
                  setCategory(e.target.value as JointCategory)
                }
              >
                <option value="BW">Butt weld (BW)</option>
                <option value="FW">Fillet weld (FW)</option>
              </Select>
            </Field>
            <Field label="Test date" required error={fieldErrors.test_date}>
              <DatePicker
                name="test_date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
                error={fieldErrors.test_date}
              />
            </Field>
            <Field label="WPS no." required error={fieldErrors.wps_no}>
              <Input
                name="wps_no"
                placeholder="ACME/PLT-A/QA/WPS-075 REV-02"
                required
                className={cn(fieldErrors.wps_no && invalidBorder)}
                onChange={() => clearError("wps_no")}
              />
            </Field>
            <Field label="Manufacturer signatory">
              <Select name="manufacturer_signatory_id" defaultValue="">
                <option value="">— none —</option>
                {manufacturers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Examining body signatory">
              <Select name="examining_body_signatory_id" defaultValue="">
                <option value="">— none —</option>
                {examiners.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Revalidation method" required>
              <Select name="revalidation_method" defaultValue="9.3b" required>
                <option value="9.3a">9.3a (3 years)</option>
                <option value="9.3b">9.3b (2 years)</option>
                <option value="9.3c">9.3c (6 months)</option>
              </Select>
            </Field>
          </div>
          <Field label="Remarks">
            <Textarea
              name="remarks"
              rows={2}
              defaultValue="WQT found satisfactory as per EN ISO 9606-1:2017"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-onyx">
              Welders ({category})
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRows((rs) => [...rs, newRow()])}
            >
              <Plus className="h-4 w-4" /> Add welder
            </Button>
          </div>

          {fieldErrors.rows && (
            <p className="text-xs text-ember">{fieldErrors.rows}</p>
          )}

          <div className="space-y-4">
            {rows.map((r, idx) => {
              const rowPrefix = `row_${r.key}`;
              const materialGradeError = fieldErrors[`${rowPrefix}_materialGrade`];
              const dimensionsError = fieldErrors[`${rowPrefix}_dimensions`];
              const testThicknessError = fieldErrors[`${rowPrefix}_testThickness`];

              return (
                <div
                  key={r.key}
                  className="rounded-[12px] border border-silver bg-frost/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-graphite">
                      #{idx + 1}
                    </span>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setRows((rs) => rs.filter((x) => x.key !== r.key))
                        }
                        className="text-steel hover:text-expired"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Welder" required>
                      <Select
                        value={r.welderId}
                        required
                        onChange={(e) => {
                          update(r.key, { welderId: e.target.value });
                          clearError("rows");
                        }}
                      >
                        <option value="">Select welder</option>
                        {welders.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.full_name}
                            {w.welder_id ? ` (${w.welder_id})` : ""}
                            {w.is_new_welder ? " *" : ""}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Process" required>
                      <Select
                        value={r.process}
                        required
                        onChange={(e) =>
                          update(r.key, { process: e.target.value })
                        }
                      >
                        {WELDING_PROCESSES.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name.split(" ")[0]} ({p.code})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Product" required>
                      <Select
                        value={r.product}
                        required
                        onChange={(e) =>
                          update(r.key, {
                            product: e.target.value as ProductType,
                          })
                        }
                      >
                        {PRODUCT_TYPES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Position" required>
                      <Select
                        value={r.position}
                        required
                        onChange={(e) =>
                          update(r.key, { position: e.target.value })
                        }
                      >
                        {positions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Material group" required>
                      <Select
                        value={r.materialGroup}
                        required
                        onChange={(e) =>
                          update(r.key, { materialGroup: e.target.value })
                        }
                      >
                        {MATERIAL_GROUPS.map((m) => (
                          <option key={m.code} value={m.code}>
                            Group {m.code}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Material grade" required error={materialGradeError}>
                      <Input
                        value={r.materialGrade}
                        required
                        onChange={(e) => {
                          update(r.key, { materialGrade: e.target.value });
                          clearError(`${rowPrefix}_materialGrade`);
                        }}
                        placeholder="IS2062 E250 BR+N"
                        className={cn(materialGradeError && invalidBorder)}
                      />
                    </Field>
                    <Field label="Dimensions" required error={dimensionsError}>
                      <Input
                        value={r.dimensions}
                        required
                        onChange={(e) => {
                          update(r.key, { dimensions: e.target.value });
                          clearError(`${rowPrefix}_dimensions`);
                        }}
                        placeholder="12(T)x300(W)x250(L)"
                        className={cn(dimensionsError && invalidBorder)}
                      />
                    </Field>
                    <Field label="Test thickness (mm)" required error={testThicknessError}>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={r.testThickness}
                        required
                        onChange={(e) => {
                          update(r.key, { testThickness: e.target.value });
                          clearError(`${rowPrefix}_testThickness`);
                        }}
                        className={cn(testThicknessError && invalidBorder)}
                      />
                    </Field>
                    <Field label="Pipe OD (mm)">
                      <Input
                        type="number"
                        step="0.1"
                        value={r.pipeOd}
                        onChange={(e) =>
                          update(r.key, { pipeOd: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Visual" required>
                      <Select
                        value={r.visualResult}
                        required
                        onChange={(e) =>
                          update(r.key, {
                            visualResult: e.target.value as "Pass" | "Fail",
                          })
                        }
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </Select>
                    </Field>
                    <Field label={category === "BW" ? "RT/UT" : "Fracture"} required>
                      <Select
                        value={r.mainResult}
                        required
                        onChange={(e) =>
                          update(r.key, {
                            mainResult: e.target.value as
                              | "Pass"
                              | "Fail"
                              | "NA",
                          })
                        }
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="NA">N/A</option>
                      </Select>
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          A qualification record is created for each welder and the range of
          approval is computed automatically.
        </p>
        <Submit pending={pending} />
      </div>
    </form>
  );
}
