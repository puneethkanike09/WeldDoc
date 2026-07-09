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
import type { Operator } from "@/types/db";
import { Loader2, Save as SaveIcon, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const invalidBorder = "border-ember ring-1 ring-ember/20";

function mapRegistrationErrors(errors: FieldErrors): FieldErrors {
  if (!errors.welder_id) return errors;
  const next = { ...errors };
  next.operator_id = errors.welder_id.replace(/welder/gi, "operator");
  delete next.welder_id;
  return next;
}

export function OperatorForm({
  action,
  operator,
  mode,
  orgDefaults,
}: {
  action: (formData: FormData) => Promise<void>;
  operator?: Operator;
  mode: "create" | "edit";
  orgDefaults?: {
    employer: string;
    branchLocation: string | null;
    suggestedPlantOperatorId?: string;
  };
}) {
  const [idMethod, setIdMethod] = useState(operator?.id_method ?? "Aadhar");
  const [dob, setDob] = useState(operator?.date_of_birth ?? "");
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
      const operatorId = formData.get("operator_id");
      if (typeof operatorId === "string" && operatorId.trim()) {
        formData.set("welder_id", operatorId.trim());
      }
    },
    [dob, location.combined],
  );

  const validate = useCallback(
    (formData: FormData) => {
      const operatorId = formData.get("operator_id");
      if (typeof operatorId === "string" && operatorId.trim()) {
        formData.set("welder_id", operatorId.trim());
      }
      const errors = mapRegistrationErrors(
        getWelderRegistrationFieldErrors(formData, mode, {
          dateOfBirth: dob,
          country: location.country,
          state: location.state,
          district: location.district,
        }),
      );
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
                defaultValue={operator?.full_name ?? ""}
                placeholder="Alex Morgan"
                className={cn(fieldErrors.full_name && invalidBorder)}
                onChange={() => clearError("full_name")}
              />
            </Field>
            <Field
              label="Plant operator ID"
              hint={
                fieldErrors.operator_id
                  ? undefined
                  : mode === "create"
                    ? "Auto-generated from your operator sequence. You can edit it — must be unique in your organisation."
                    : "Must be unique in your organisation."
              }
              required
              error={fieldErrors.operator_id}
            >
              <Input
                name="operator_id"
                defaultValue={
                  operator?.operator_id ??
                  orgDefaults?.suggestedPlantOperatorId ??
                  ""
                }
                placeholder="O#01"
                className={cn(fieldErrors.operator_id && invalidBorder)}
                onChange={() => clearError("operator_id")}
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
                initialValue={operator?.place_of_birth}
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
                  defaultValue={operator?.id_number ?? ""}
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
                defaultValue={operator?.employer ?? orgDefaults?.employer ?? ""}
                placeholder="Acme Fabrication Ltd"
                className={cn(fieldErrors.employer && invalidBorder)}
                onChange={() => clearError("employer")}
              />
            </Field>
            <Field label="Branch / site" required error={fieldErrors.branch_location}>
              <Input
                name="branch_location"
                defaultValue={
                  operator?.branch_location ??
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
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Label className="mr-auto mb-0 text-steel">
          Plant operator ID and QR code are assigned automatically on save.
        </Label>
        <SubmitButton
          label={mode === "create" ? "Create operator" : "Save changes"}
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
