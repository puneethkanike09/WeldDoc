"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import { Loader2, Save as SaveIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Organization } from "@/types/db";

const invalidBorder = "border-ember ring-1 ring-ember/20";

function Save({
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

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export function OrgSettingsForm({
  org,
  action,
}: {
  org: Organization;
  action: (fd: FormData) => Promise<void>;
}) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearError = (key: string) =>
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const validate = useCallback((formData: FormData) => {
    const errors: FieldErrors = {};
    if (!str(formData.get("name"))) errors.name = "Company name is required.";
    if (!str(formData.get("report_prefix"))) {
      errors.report_prefix = "Report number prefix is required.";
    }
    setFieldErrors(errors);
    return errors;
  }, []);

  const { onSubmit, pending } = useFormSubmit(action, validate);

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name" required error={fieldErrors.name}>
          <Input
            name="name"
            defaultValue={org.name}
            className={cn(fieldErrors.name && invalidBorder)}
            onChange={() => clearError("name")}
          />
        </Field>
        <Field label="Location code" hint="e.g. PLT-A">
          <Input name="location_code" defaultValue={org.location_code ?? ""} />
        </Field>
        <Field
          label="Report number prefix"
          hint="e.g. ACME/PLT-A/WPQ-"
          required
          error={fieldErrors.report_prefix}
        >
          <Input
            name="report_prefix"
            defaultValue={org.report_prefix}
            className={cn(fieldErrors.report_prefix && invalidBorder)}
            onChange={() => clearError("report_prefix")}
          />
        </Field>
      </div>
      <Field
        label="Company logo"
        hint="Shown on certificates and master list exports (PNG/JPG)"
      >
        <FileDropzone
          name="logo"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          defaultLabel={org.logo_path ? "Replace logo" : undefined}
          placeholder="Drop company logo here or click to browse"
        />
      </Field>
      <div className="flex justify-end">
        <Save label="Save settings" icon={SaveIcon} pending={pending} />
      </div>
    </form>
  );
}
