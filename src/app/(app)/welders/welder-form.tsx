"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field, Label } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { LocationSelect } from "@/components/app/location-select";
import { ID_METHODS } from "@/lib/iso9606/constants";
import { getWelderRegistrationFieldErrors } from "@/lib/iso9606/qualification-fields";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import type { Welder } from "@/types/db";
import { Loader2, Save as SaveIcon, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const invalidBorder = "border-ember ring-1 ring-ember/20";

export function WelderForm({
  action,
  welder,
  mode,
  orgDefaults,
}: {
  action: (formData: FormData) => Promise<void>;
  welder?: Welder;
  mode: "create" | "edit";
  orgDefaults?: {
    employer: string;
    branchLocation: string | null;
    suggestedPlantWelderId?: string;
  };
}) {
  const [idMethod, setIdMethod] = useState(welder?.id_method ?? "Aadhar");
  const [dob, setDob] = useState(welder?.date_of_birth ?? "");
  const [location, setLocation] = useState({
    country: "",
    state: "",
    district: "",
    combined: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const showOther =
    !ID_METHODS.includes(idMethod as (typeof ID_METHODS)[number]) ||
    idMethod === "Other";

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const prepare = useCallback(
    (formData: FormData) => {
      if (dob) formData.set("date_of_birth", dob);
      if (location.combined) formData.set("place_of_birth", location.combined);
    },
    [dob, location.combined],
  );

  const validate = useCallback(
    (formData: FormData) => {
      const errors = getWelderRegistrationFieldErrors(formData, mode, {
        dateOfBirth: dob,
        country: location.country,
        state: location.state,
        district: location.district,
      });
      setFieldErrors(errors);
      return errors;
    },
    [dob, location, mode],
  );

  const { onSubmit, pending } = useFormSubmit(action, validate, prepare);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Personal details
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              className="sm:col-span-2"
              required
              error={fieldErrors.full_name}
            >
              <Input
                name="full_name"
                defaultValue={welder?.full_name ?? ""}
                placeholder="Alex Morgan"
                className={cn(fieldErrors.full_name && invalidBorder)}
                onChange={() => clearError("full_name")}
              />
            </Field>
            <Field
              label="Plant welder ID"
              hint={
                fieldErrors.welder_id
                  ? undefined
                  : mode === "create"
                    ? "Auto-generated from your welder sequence. You can edit it — must be unique in your organisation."
                    : "Must be unique in your organisation."
              }
              required
              error={fieldErrors.welder_id}
            >
              <Input
                name="welder_id"
                defaultValue={
                  welder?.welder_id ??
                  orgDefaults?.suggestedPlantWelderId ??
                  ""
                }
                placeholder="W#01"
                className={cn(fieldErrors.welder_id && invalidBorder)}
                onChange={() => clearError("welder_id")}
              />
            </Field>
            <Field label="Date of birth" required error={fieldErrors.date_of_birth}>
              <DatePicker
                name="date_of_birth"
                value={dob}
                onChange={(v) => {
                  setDob(v);
                  clearError("date_of_birth");
                }}
                placeholder="Select date of birth"
                required
                error={fieldErrors.date_of_birth}
              />
            </Field>
            <div className="sm:col-span-2">
              <Label required>Place of birth</Label>
              <LocationSelect
                name="place_of_birth"
                initialValue={welder?.place_of_birth}
                required
                fieldErrors={{
                  country: fieldErrors.country,
                  state: fieldErrors.state,
                  district: fieldErrors.district,
                }}
                onValuesChange={(v) => {
                  setLocation(v);
                  clearError("country");
                  clearError("state");
                  clearError("district");
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ID method" required error={fieldErrors.id_method}>
                <Select
                  name="id_method"
                  value={idMethod}
                  onChange={(e) => {
                    setIdMethod(e.target.value);
                    clearError("id_method");
                  }}
                  required
                  className={cn(fieldErrors.id_method && invalidBorder)}
                >
                  {ID_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="ID number" required error={fieldErrors.id_number}>
                <Input
                  name="id_number"
                  defaultValue={welder?.id_number ?? ""}
                  placeholder="ID / passport no."
                  className={cn(fieldErrors.id_number && invalidBorder)}
                  onChange={() => clearError("id_number")}
                />
              </Field>
            </div>
            {showOther && (
              <Field
                label="Specify ID method"
                className="sm:col-span-2"
                required
                error={fieldErrors.id_method_other}
              >
                <Input
                  name="id_method_other"
                  placeholder="Other ID type"
                  className={cn(fieldErrors.id_method_other && invalidBorder)}
                  onChange={() => clearError("id_method_other")}
                />
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
            <Field
              label="Employer"
              hint={fieldErrors.employer ? undefined : "Auto-filled from your organisation"}
              required
              error={fieldErrors.employer}
            >
              <Input
                name="employer"
                defaultValue={welder?.employer ?? orgDefaults?.employer ?? ""}
                placeholder="Acme Fabrication Ltd"
                className={cn(fieldErrors.employer && invalidBorder)}
                onChange={() => clearError("employer")}
              />
            </Field>
            <Field label="Branch / site" required error={fieldErrors.branch_location}>
              <Input
                name="branch_location"
                defaultValue={
                  welder?.branch_location ??
                  orgDefaults?.branchLocation ??
                  ""
                }
                placeholder="Plant A / North Yard"
                className={cn(fieldErrors.branch_location && invalidBorder)}
                onChange={() => clearError("branch_location")}
              />
            </Field>
            <Field
              label="Photograph"
              className="sm:col-span-2"
              required={mode === "create"}
              error={fieldErrors.photo}
            >
              <FileDropzone
                name="photo"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required={mode === "create"}
                error={fieldErrors.photo}
                placeholder="Drop photo here or click to browse (JPEG/PNG for certificate; PDF stored as document)"
                onFileSelect={() => clearError("photo")}
              />
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
                first-time qualification: after save you go to the 4-step
                Qualify workflow. Uncheck for welders with prior qualifications
                (opens legacy data entry instead).
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
          pending={pending}
        />
      </div>
    </form>
  );
}

function SubmitButton({
  label,
  icon: Icon,
  pending,
}: {
  label: string;
  icon: LucideIcon;
  pending: boolean;
}) {
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
