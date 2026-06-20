"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import {
  WELDING_PROCESSES,
  PRODUCT_TYPES,
  JOINT_TYPES,
  BW_POSITIONS,
  FW_POSITIONS,
  POSITION_LABELS,
  MATERIAL_GROUPS,
  FILLER_GROUPS,
  REVALIDATION_METHODS,
  TESTING_STANDARDS,
} from "@/lib/iso9606/constants";
import type { Welder } from "@/types/db";
import { FileArchive, Loader2 } from "lucide-react";

const invalidBorder = "border-ember ring-1 ring-ember/20";

function Submit({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileArchive className="h-4 w-4" />
      )}
      Save old welder qualification
    </Button>
  );
}

const LEGACY_FIELDS = [
  { key: "A", label: "Welder name", note: "From profile" },
  { key: "B", label: "Process", note: "Select" },
  { key: "C", label: "Joint type", note: "Select" },
  { key: "D", label: "Position", note: "Select" },
  { key: "E", label: "FM / material group", note: "Select" },
  { key: "F", label: "Thickness (test / deposited)", note: "Type mm" },
  { key: "G", label: "Test / qualification date", note: "Calendar" },
  { key: "H", label: "Valid up to", note: "Calendar or auto" },
  { key: "I", label: "Revalidation method", note: "Select 9.3a/b/c" },
  { key: "J", label: "Welder no.", note: "From profile" },
] as const;

export function LegacyForm({
  action,
  welder,
}: {
  action: (fd: FormData) => Promise<void>;
  welder: Welder;
}) {
  const [qualDate, setQualDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = useCallback(
    (formData: FormData) => {
      const errors: FieldErrors = {};
      const date = qualDate || formData.get("date_of_welding")?.toString();
      if (!date) errors.date_of_welding = "Date of initial qualification is required.";
      const thickness = formData.get("test_thickness_mm")?.toString().trim();
      if (!thickness) errors.test_thickness_mm = "Test thickness is required.";
      setFieldErrors(errors);
      return errors;
    },
    [qualDate],
  );

  const prepare = useCallback(
    (formData: FormData) => {
      if (qualDate) formData.set("date_of_welding", qualDate);
    },
    [qualDate],
  );

  const { onSubmit, pending } = useFormSubmit(action, validate, prepare);

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Old data entry — prior qualification
            </h3>
            <p className="mt-1 text-[14px] text-graphite">
              For welders already qualified before WeldDoc. Enter the minimum
              A–J fields, upload the full PDF bundle, and set pass/fail for key
              tests. Alarms and the master list work from these dates.
            </p>
          </div>

          <div className="rounded-[10px] border border-silver bg-frost/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-steel">
              Registry fields (A–J)
            </p>
            <ul className="mt-2 grid gap-1 text-xs text-graphite sm:grid-cols-2">
              {LEGACY_FIELDS.map((f) => (
                <li key={f.key}>
                  <span className="font-medium text-onyx">{f.key}.</span>{" "}
                  {f.label}{" "}
                  <span className="text-steel">({f.note})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 rounded-[10px] border border-silver p-4 sm:grid-cols-2">
            <Field label="A — Welder name">
              <Input value={welder.full_name} disabled />
            </Field>
            <Field label="J — Welder no.">
              <Input value={welder.welder_id ?? welder.uid} disabled />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="B — Welding process" required>
              <Select name="process" defaultValue="135" required>
                {WELDING_PROCESSES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name.split(" ")[0]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="C — Joint type" required>
              <Select name="joint_type" defaultValue="BW" required>
                {JOINT_TYPES.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="D — Position" required>
              <Select name="position" defaultValue="PF" required>
                {Array.from(new Set([...BW_POSITIONS, ...FW_POSITIONS])).map(
                  (p) => (
                    <option key={p} value={p}>
                      {POSITION_LABELS[p] ?? p}
                    </option>
                  ),
                )}
              </Select>
            </Field>
            <Field label="E — FM / parent material group" required>
              <Select name="base_material_group" defaultValue="1" required>
                {MATERIAL_GROUPS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="E — Filler group">
              <Select name="filler_group" defaultValue="FM1">
                {FILLER_GROUPS.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Testing standard" required>
              <Select
                name="testing_standard"
                defaultValue="EN ISO 9606-1:2017"
                required
              >
                {TESTING_STANDARDS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="F — Test thickness (mm)" required error={fieldErrors.test_thickness_mm}>
              <Input
                type="number"
                step="0.1"
                name="test_thickness_mm"
                required
                className={cn(fieldErrors.test_thickness_mm && invalidBorder)}
                onChange={() =>
                  setFieldErrors((prev) => {
                    if (!prev.test_thickness_mm) return prev;
                    const next = { ...prev };
                    delete next.test_thickness_mm;
                    return next;
                  })
                }
              />
            </Field>
            <Field label="F — Deposited / throat (mm)">
              <Input type="number" step="0.1" name="deposited_thickness_mm" />
            </Field>
            <Field label="Pipe OD (mm)">
              <Input type="number" step="0.1" name="pipe_od_mm" />
            </Field>
            <Field label="Product" required>
              <Select name="product" defaultValue="Plate" required>
                {PRODUCT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="G — Date of initial qualification" required error={fieldErrors.date_of_welding}>
              <DatePicker
                name="date_of_welding"
                value={qualDate}
                onChange={(v) => {
                  setQualDate(v);
                  setFieldErrors((prev) => {
                    if (!prev.date_of_welding) return prev;
                    const next = { ...prev };
                    delete next.date_of_welding;
                    return next;
                  });
                }}
                required
                error={fieldErrors.date_of_welding}
              />
            </Field>
            <Field label="H — Valid up to" hint="Leave blank to compute from 9.3 method">
              <DatePicker name="expiry_date" />
            </Field>
            <Field label="Last 6-month continuity confirmed">
              <DatePicker name="continuity_last_verified" />
            </Field>
            <Field label="I — Revalidation method" required>
              <Select name="revalidation_method" defaultValue="9.3b" required>
                {REVALIDATION_METHODS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Visual test (VT)">
              <Select name="result_vt" defaultValue="Pass">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="NA">N/A</option>
              </Select>
            </Field>
            <Field label="RT / UT">
              <Select name="result_rt_ut" defaultValue="NA">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="NA">N/A</option>
              </Select>
            </Field>
            <Field label="Fracture test">
              <Select name="result_fracture" defaultValue="NA">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="NA">N/A</option>
              </Select>
            </Field>
          </div>

          <Field label="Upload qualification file bundle (PDF / images)">
            <FileDropzone
              name="legacy_docs"
              accept="application/pdf,image/*"
              multiple
              placeholder="Drop certificate, VT, RT, continuity reports — or click to browse"
            />
          </Field>

          <div className="flex justify-end">
            <Submit pending={pending} />
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
