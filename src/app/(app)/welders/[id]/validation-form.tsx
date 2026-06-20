"use client";

import { useFormStatus } from "react-dom";
import { Input, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { DatePicker } from "@/components/sui/date-picker";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Loader2, ShieldPlus } from "lucide-react";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShieldPlus className="h-4 w-4" />
      )}
      Log entry
    </Button>
  );
}

export function ValidationForm({
  action,
}: {
  action: (fd: FormData) => void;
}) {
  return (
    <details className="mt-3 rounded-[10px] border border-silver">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13.5px] font-medium text-charcoal">
        <ShieldPlus className="h-4 w-4 text-active-ink" />
        Log continuity / revalidation
      </summary>
      <form action={action} className="space-y-3 border-t border-silver p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <Select name="kind" defaultValue="continuity">
              <option value="continuity">6-month continuity (9.2)</option>
              <option value="revalidation">Revalidation (extends expiry)</option>
            </Select>
          </Field>
          <Field label="Date">
            <DatePicker
              name="validated_on"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
          <Field label="Validator">
            <Input name="validator_name" placeholder="Employer / examiner" />
          </Field>
          <Field label="Note">
            <Input name="note" placeholder="Optional note" />
          </Field>
        </div>
        <p className="text-xs text-steel">
          After logging continuity, re-download the certificate — the 9.2
          prolongation table will include the new date.
        </p>
        <Field label="Supporting document">
          <FileDropzone
            name="supporting_doc"
            accept="application/pdf,image/*"
            placeholder="Drop evidence (PDF / image) or click to browse"
          />
        </Field>
        <div className="flex justify-end">
          <Submit />
        </div>
      </form>
    </details>
  );
}
