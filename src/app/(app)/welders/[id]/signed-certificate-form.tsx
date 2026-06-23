"use client";

import { useCallback } from "react";
import { Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import { Loader2, PenLine, Upload } from "lucide-react";

export function SignedCertificateForm({
  action,
  hasSignedCertificate,
}: {
  action: (fd: FormData) => Promise<void>;
  hasSignedCertificate: boolean;
}) {
  const validate = useCallback((formData: FormData) => {
    const errors: FieldErrors = {};
    const file = formData.get("signed_certificate");
    if (!(file instanceof File) || file.size === 0) {
      errors.signed_certificate = "Select the signed certificate file.";
    }
    return errors;
  }, []);

  const { onSubmit, pending } = useFormSubmit(action, validate);

  return (
    <details className="mt-4 rounded-[10px] border border-silver">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13.5px] font-medium text-charcoal">
        <PenLine className="h-4 w-4 text-active-ink" />
        {hasSignedCertificate
          ? "Replace signed certificate"
          : "Upload signed certificate"}
      </summary>
      <form
        onSubmit={onSubmit}
        className="space-y-3 border-t border-silver p-3"
        noValidate
      >
        <p className="text-xs text-steel">
          Download the certificate, sign it by hand, scan or photograph it, then
          upload the PDF or image here. You can view, print, or download it
          anytime from this qualification.
        </p>
        <Field label="Signed certificate file" required>
          <FileDropzone
            name="signed_certificate"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            placeholder="Drop signed certificate (PDF or image) or click to browse"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {hasSignedCertificate ? "Replace upload" : "Upload signed copy"}
          </Button>
        </div>
      </form>
    </details>
  );
}
