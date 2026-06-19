"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Select, Field, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LocationSelect } from "@/components/app/location-select";
import { ID_METHODS } from "@/lib/iso9606/constants";
import type { Welder } from "@/types/db";
import { Loader2, UploadCloud } from "lucide-react";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function WelderForm({
  action,
  welder,
  mode,
}: {
  action: (formData: FormData) => void;
  welder?: Welder;
  mode: "create" | "edit";
}) {
  const [idMethod, setIdMethod] = useState(welder?.id_method ?? "Aadhar");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const showOther = !ID_METHODS.includes(idMethod as (typeof ID_METHODS)[number]) || idMethod === "Other";

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Personal details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <Input
                name="full_name"
                defaultValue={welder?.full_name ?? ""}
                placeholder="Damburu Pradhan"
                required
              />
            </Field>
            <Field label="Plant welder ID" hint="e.g. W#199">
              <Input
                name="welder_id"
                defaultValue={welder?.welder_id ?? ""}
                placeholder="W#199"
              />
            </Field>
            <Field label="Date of birth">
              <Input
                type="date"
                name="date_of_birth"
                defaultValue={welder?.date_of_birth ?? ""}
              />
            </Field>
            <div className="sm:col-span-2">
              <Label>Place of birth</Label>
              <LocationSelect
                name="place_of_birth"
                initialValue={welder?.place_of_birth}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID method">
                <Select
                  name="id_method"
                  value={idMethod}
                  onChange={(e) => setIdMethod(e.target.value)}
                >
                  {ID_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ID number">
                <Input
                  name="id_number"
                  defaultValue={welder?.id_number ?? ""}
                  placeholder="ID / passport no."
                />
              </Field>
            </div>
            {showOther && (
              <Field label="Specify ID method" className="sm:col-span-2">
                <Input name="id_method_other" placeholder="Other ID type" />
              </Field>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Employer &amp; photo
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Employer">
              <Input
                name="employer"
                defaultValue={welder?.employer ?? ""}
                placeholder="SMS India Pvt Ltd"
              />
            </Field>
            <Field label="Branch / location">
              <Input
                name="branch_location"
                defaultValue={welder?.branch_location ?? ""}
                placeholder="Bhubaneswar"
              />
            </Field>
            <Field label="Photograph" className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-silver bg-frost px-4 py-3.5 text-sm text-graphite transition-colors hover:border-onyx/40">
                <UploadCloud className="h-5 w-5 text-steel" />
                <span>
                  {photoName ?? "Upload photo (JPEG, PNG, etc.)"}
                </span>
                <input
                  type="file"
                  name="photo"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setPhotoName(e.target.files?.[0]?.name ?? null)
                  }
                />
              </label>
            </Field>
          </div>

          {mode === "create" && (
            <label className="flex items-start gap-3 rounded-[10px] bg-frost px-4 py-3">
              <input
                type="checkbox"
                name="is_new_welder"
                defaultChecked
                className="mt-0.5 h-4 w-4 accent-[#aa2d00]"
              />
              <span className="text-[14px] text-charcoal">
                <span className="font-medium text-onyx">New welder</span> —
                this is a first-time qualification (uncheck for welders with
                prior / legacy qualifications).
              </span>
            </label>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Label className="mr-auto mb-0 text-steel">
          UID &amp; QR code are generated automatically on save.
        </Label>
        <SubmitButton label={mode === "create" ? "Create welder" : "Save changes"} />
      </div>
    </form>
  );
}
