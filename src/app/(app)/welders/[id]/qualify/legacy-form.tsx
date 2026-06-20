"use client";

import { useFormStatus } from "react-dom";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
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
import { FileArchive, Loader2, UploadCloud } from "lucide-react";

function Submit() {
  const { pending } = useFormStatus();
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
  action: (fd: FormData) => void;
  welder: Welder;
}) {
  return (
    <form action={action}>
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
            <Field label="B — Welding process">
              <Select name="process" defaultValue="135">
                {WELDING_PROCESSES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name.split(" ")[0]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="C — Joint type">
              <Select name="joint_type" defaultValue="BW">
                {JOINT_TYPES.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="D — Position">
              <Select name="position" defaultValue="PF">
                {Array.from(new Set([...BW_POSITIONS, ...FW_POSITIONS])).map(
                  (p) => (
                    <option key={p} value={p}>
                      {POSITION_LABELS[p] ?? p}
                    </option>
                  ),
                )}
              </Select>
            </Field>
            <Field label="E — FM / parent material group">
              <Select name="base_material_group" defaultValue="1">
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
            <Field label="Testing standard">
              <Select
                name="testing_standard"
                defaultValue="EN ISO 9606-1:2017"
              >
                {TESTING_STANDARDS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="F — Test thickness (mm)">
              <Input type="number" step="0.1" name="test_thickness_mm" />
            </Field>
            <Field label="F — Deposited / throat (mm)">
              <Input type="number" step="0.1" name="deposited_thickness_mm" />
            </Field>
            <Field label="Pipe OD (mm)">
              <Input type="number" step="0.1" name="pipe_od_mm" />
            </Field>
            <Field label="Product">
              <Select name="product" defaultValue="Plate">
                {PRODUCT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="G — Date of initial qualification">
              <DatePicker name="date_of_welding" required />
            </Field>
            <Field label="H — Valid up to" hint="Leave blank to compute from 9.3 method">
              <DatePicker name="expiry_date" />
            </Field>
            <Field label="Last 6-month continuity confirmed">
              <DatePicker name="continuity_last_verified" />
            </Field>
            <Field label="I — Revalidation method">
              <Select name="revalidation_method" defaultValue="9.3b">
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
            <label className="flex cursor-pointer flex-col gap-2 rounded-[10px] border border-dashed border-silver bg-frost px-4 py-4 text-sm text-graphite hover:border-onyx/40">
              <span className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-steel" />
                Select one or more files — certificate, VT, RT, continuity reports
              </span>
              <input
                type="file"
                name="legacy_docs"
                accept="application/pdf,image/*"
                multiple
                className="text-[13px]"
              />
            </label>
          </Field>

          <div className="flex justify-end">
            <Submit />
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
