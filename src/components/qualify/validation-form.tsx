"use client";

import { useCallback, useState } from "react";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import { Loader2, ShieldPlus } from "lucide-react";

export function ValidationForm({
  action,
  continuityLabel = "6-month continuity (9.2)",
  revalidationLabel = "Revalidation (extends expiry)",
  certificateHint = "After logging continuity, re-download the certificate — the prolongation table will include the new date.",
}: {
  action: (fd: FormData) => Promise<void>;
  continuityLabel?: string;
  revalidationLabel?: string;
  certificateHint?: string;
}) {
  const [validatedOn, setValidatedOn] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validate = useCallback(
    (formData: FormData) => {
      const errors: FieldErrors = {};
      if (!validatedOn && !formData.get("validated_on")) {
        errors.validated_on = "Select a date.";
      }
      setFieldErrors(errors);
      return errors;
    },
    [validatedOn],
  );

  const prepare = useCallback(
    (formData: FormData) => {
      if (validatedOn) formData.set("validated_on", validatedOn);
    },
    [validatedOn],
  );

  const { onSubmit, pending } = useFormSubmit(action, validate, prepare);

  return (
    <details className="mt-3 rounded-[10px] border border-silver">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13.5px] font-medium text-charcoal">
        <ShieldPlus className="h-4 w-4 text-active-ink" />
        Log continuity / revalidation
      </summary>
      <form onSubmit={onSubmit} className="space-y-3 border-t border-silver p-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type" required>
            <Select name="kind" defaultValue="continuity" required>
              <option value="continuity">{continuityLabel}</option>
              <option value="revalidation">{revalidationLabel}</option>
            </Select>
          </Field>
          <Field label="Date" required error={fieldErrors.validated_on}>
            <DatePicker
              name="validated_on"
              value={validatedOn}
              onChange={(v) => {
                setValidatedOn(v);
                setFieldErrors((prev) => {
                  if (!prev.validated_on) return prev;
                  const next = { ...prev };
                  delete next.validated_on;
                  return next;
                });
              }}
              required
              error={fieldErrors.validated_on}
            />
          </Field>
          <Field label="Validator">
            <Input name="validator_name" placeholder="Employer / examiner" />
          </Field>
          <Field label="Note">
            <Input name="note" placeholder="Optional note" />
          </Field>
        </div>
        <p className="text-xs text-steel">{certificateHint}</p>
        <Field label="Supporting document">
          <FileDropzone
            name="supporting_doc"
            accept="application/pdf,image/*"
            placeholder="Drop evidence (PDF / image) or click to browse"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldPlus className="h-4 w-4" />
            )}
            Log entry
          </Button>
        </div>
      </form>
    </details>
  );
}
