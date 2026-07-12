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
import { Select } from "@/components/sui/select";
import {
  MAX_LOGO_SIZE_PX,
  MAX_NAME_SIZE_PX,
  MIN_LOGO_SIZE_PX,
  MIN_NAME_SIZE_PX,
  parseCertificateBranding,
  type CertificateBrandingAlign,
} from "@/lib/certificate/branding";

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

const BRAND_ALIGN_OPTIONS: { value: CertificateBrandingAlign; label: string }[] =
  [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

function CertificateBrandingFieldRow({
  id,
  label,
  hint,
  enabled,
  align,
  sizePx,
  sizeLabel,
  sizeMin,
  sizeMax,
}: {
  id: "logo" | "name";
  label: string;
  hint?: string;
  enabled: boolean;
  align: CertificateBrandingAlign;
  sizePx: number;
  sizeLabel: string;
  sizeMin: number;
  sizeMax: number;
}) {
  return (
    <div className="grid gap-3 rounded-[10px] border border-silver bg-frost/40 px-4 py-3 sm:grid-cols-[1fr_9rem_7rem] sm:items-start">
      <div className="sm:pt-6.5">
        <label
          htmlFor={`cert_brand_${id}_enabled`}
          className="inline-flex w-fit max-w-full cursor-pointer items-center gap-2.5 text-sm font-medium text-onyx"
        >
          <input
            id={`cert_brand_${id}_enabled`}
            type="checkbox"
            name={`cert_brand_${id}_enabled`}
            value="1"
            defaultChecked={enabled}
            className="form-check"
          />
          {label}
        </label>
        {hint ? <p className="mt-1 text-xs text-steel">{hint}</p> : null}
      </div>
      <Field label="Alignment" className="sm:w-36" reserveMessageSpace>
        <Select
          name={`cert_brand_${id}_align`}
          defaultValue={align}
          aria-label={`${label} alignment`}
        >
          {BRAND_ALIGN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label={sizeLabel}
        hint={`${sizeMin}–${sizeMax} px`}
        className="sm:w-28"
        reserveMessageSpace
      >
        <Input
          type="number"
          name={`cert_brand_${id}_size_px`}
          defaultValue={sizePx}
          min={sizeMin}
          max={sizeMax}
          step={1}
          aria-label={`${label} size in pixels`}
        />
      </Field>
    </div>
  );
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

  const { onSubmit, pending } = useFormSubmit(
    action,
    validate,
    undefined,
    "Settings saved.",
  );
  const branding = parseCertificateBranding(org.certificate_branding);

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

      <div className="space-y-3 border-t border-silver pt-5">
        <div>
          <p className="text-sm font-medium text-onyx">Certificate branding</p>
          <p className="mt-1 text-xs text-steel">
            Control whether logo and company name appear on welder and operator
            certificates, how each is aligned, and the size in pixels.
          </p>
        </div>
        <CertificateBrandingFieldRow
          id="logo"
          label="Company logo"
          hint="Requires a logo upload above."
          enabled={branding.logo.enabled}
          align={branding.logo.align}
          sizePx={branding.logo.sizePx}
          sizeLabel="Logo height (px)"
          sizeMin={MIN_LOGO_SIZE_PX}
          sizeMax={MAX_LOGO_SIZE_PX}
        />
        <CertificateBrandingFieldRow
          id="name"
          label="Company name"
          enabled={branding.name.enabled}
          align={branding.name.align}
          sizePx={branding.name.sizePx}
          sizeLabel="Font size (px)"
          sizeMin={MIN_NAME_SIZE_PX}
          sizeMax={MAX_NAME_SIZE_PX}
        />
      </div>

      <div className="flex justify-end">
        <Save label="Save settings" icon={SaveIcon} pending={pending} />
      </div>
    </form>
  );
}
