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
  isLegacy = false,
}: {
  action: (fd: FormData) => Promise<void>;
  hasSignedCertificate: boolean;
  /** Bulk-imported quals: upload the existing paper certificate, not a signed WeldDoc copy. */
  isLegacy?: boolean;
}) {
  const validate = useCallback((formData: FormData) => {
    const errors: FieldErrors = {};
    const file = formData.get("signed_certificate");
    if (!(file instanceof File) || file.size === 0) {
      errors.signed_certificate = isLegacy
        ? "Select the original certificate file."
        : "Select the signed certificate file.";
    }
    return errors;
  }, [isLegacy]);

  const { onSubmit, pending } = useFormSubmit(
    action,
    validate,
    undefined,
    isLegacy
      ? hasSignedCertificate
        ? "Original certificate replaced."
        : "Original certificate uploaded."
      : hasSignedCertificate
        ? "Signed certificate replaced."
        : "Signed certificate uploaded.",
  );

  return (
    <details className="mt-4 rounded-[10px] border border-silver">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13.5px] font-medium text-charcoal">
        <PenLine className="h-4 w-4 text-active-ink" />
        {isLegacy
          ? hasSignedCertificate
            ? "Replace original certificate"
            : "Upload original certificate"
          : hasSignedCertificate
            ? "Replace signed certificate"
            : "Upload signed certificate"}
      </summary>
      <form
        onSubmit={onSubmit}
        className="space-y-3 border-t border-silver p-3"
        noValidate
      >
        <p className="text-xs text-steel">
          {isLegacy
            ? "Upload the existing paper certificate from this legacy qualification (PDF or image). You can view or replace it anytime from this qualification."
            : "Download the certificate, sign it by hand, scan or photograph it, then upload the PDF or image here. You can view, print, or download it anytime from this qualification."}
        </p>
        <Field
          label={isLegacy ? "Original certificate file" : "Signed certificate file"}
          required
        >
          <FileDropzone
            name="signed_certificate"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            placeholder={
              isLegacy
                ? "Drop original certificate (PDF or image) or click to browse"
                : "Drop signed certificate (PDF or image) or click to browse"
            }
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {hasSignedCertificate
              ? "Replace upload"
              : isLegacy
                ? "Upload original"
                : "Upload signed copy"}
          </Button>
        </div>
      </form>
    </details>
  );
}
