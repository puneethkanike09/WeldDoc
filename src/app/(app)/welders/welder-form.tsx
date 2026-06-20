"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Field, Label } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { LocationSelect } from "@/components/app/location-select";
import { ID_METHODS } from "@/lib/iso9606/constants";
import type { Welder } from "@/types/db";
import { Loader2, Save as SaveIcon, UploadCloud, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function SubmitButton({
  label,
  icon: Icon,
}: {
  label: string;
  icon: LucideIcon;
}) {
  const { pending } = useFormStatus();
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

export function WelderForm({
  action,
  welder,
  mode,
  orgDefaults,
}: {
  action: (formData: FormData) => void;
  welder?: Welder;
  mode: "create" | "edit";
  orgDefaults?: { employer: string; branchLocation: string | null };
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
                placeholder="Alex Morgan"
                required
              />
            </Field>
            <Field label="Plant welder ID" hint="e.g. W#247">
              <Input
                name="welder_id"
                defaultValue={welder?.welder_id ?? ""}
                placeholder="W#247"
                required
              />
            </Field>
            <Field label="Date of birth">
              <DatePicker
                name="date_of_birth"
                defaultValue={welder?.date_of_birth ?? ""}
                placeholder="Select date of birth"
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Label>Place of birth</Label>
              <LocationSelect
                name="place_of_birth"
                initialValue={welder?.place_of_birth}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID method">
                <Select
                  name="id_method"
                  value={idMethod}
                  onChange={(e) => setIdMethod(e.target.value)}
                  required
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
                  required
                />
              </Field>
            </div>
            {showOther && (
              <Field label="Specify ID method" className="sm:col-span-2">
                <Input name="id_method_other" placeholder="Other ID type" required />
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
            <Field label="Employer" hint="Auto-filled from your organisation">
              <Input
                name="employer"
                defaultValue={welder?.employer ?? orgDefaults?.employer ?? ""}
                placeholder="Acme Fabrication Ltd"
                required
              />
            </Field>
            <Field label="Branch / site">
              <Input
                name="branch_location"
                defaultValue={
                  welder?.branch_location ??
                  orgDefaults?.branchLocation ??
                  ""
                }
                placeholder="Plant A / North Yard"
                required
              />
            </Field>
            <Field label="Photograph" className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-silver bg-frost px-4 py-3.5 text-sm text-graphite transition-colors hover:border-onyx/40">
                <UploadCloud className="h-5 w-5 text-steel" />
                <span>
                  {photoName ?? "Upload photo (JPEG/PNG for certificate; PDF stored as document)"}
                </span>
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  required={mode === "create"}
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
                className="mt-0.5 h-4 w-4 accent-[#f90a08]"
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
        <SubmitButton
          label={mode === "create" ? "Create welder" : "Save changes"}
          icon={mode === "create" ? UserPlus : SaveIcon}
        />
      </div>
    </form>
  );
}
