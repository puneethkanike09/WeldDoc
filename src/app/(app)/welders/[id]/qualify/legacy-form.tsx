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
  FILLER_TYPES,
  REVALIDATION_METHODS,
} from "@/lib/iso9606/constants";
import { Loader2, UploadCloud } from "lucide-react";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Save legacy qualification
    </Button>
  );
}

export function LegacyForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action}>
      <Card>
        <CardBody className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-onyx">
              Legacy / prior qualification
            </h3>
            <p className="mt-1 text-[14px] text-graphite">
              For welders qualified earlier. Capture the key parameters and
              upload the scanned certificate &amp; reports. The record is marked
              approved with the original qualification date.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Welding process (ISO 4063)">
              <Select name="process" defaultValue="135">
                {WELDING_PROCESSES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} — {p.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Joint type">
              <Select name="joint_type" defaultValue="BW">
                {JOINT_TYPES.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Product type">
              <Select name="product" defaultValue="Plate">
                {PRODUCT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Welding position">
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
            <Field label="Parent material group">
              <Select name="base_material_group" defaultValue="1">
                {MATERIAL_GROUPS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filler material group">
              <Select name="filler_group" defaultValue="FM1">
                {FILLER_GROUPS.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filler type">
              <Select name="filler_type" defaultValue={FILLER_TYPES[1]}>
                {FILLER_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Test thickness (mm)">
              <Input type="number" step="0.1" name="test_thickness_mm" />
            </Field>
            <Field label="Deposited / throat thickness (mm)">
              <Input type="number" step="0.1" name="deposited_thickness_mm" />
            </Field>
            <Field label="Pipe outside diameter (mm)">
              <Input type="number" step="0.1" name="pipe_od_mm" />
            </Field>
            <Field label="Date of initial qualification">
              <DatePicker name="date_of_welding" required />
            </Field>
            <Field label="Revalidation method (cl. 9.3)">
              <Select name="revalidation_method" defaultValue="9.3b">
                {REVALIDATION_METHODS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Scanned certificate / reports (PDF)">
            <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-silver bg-frost px-4 py-3.5 text-sm text-graphite hover:border-onyx/40">
              <UploadCloud className="h-5 w-5 text-steel" />
              <span>Upload scanned PDF</span>
              <input
                type="file"
                name="legacy_doc"
                accept="application/pdf,image/*"
                className="hidden"
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
