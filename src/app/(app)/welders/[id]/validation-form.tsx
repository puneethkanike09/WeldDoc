"use client";

import { useFormStatus } from "react-dom";
import { Input, Select, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, ShieldPlus } from "lucide-react";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
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
            <Input
              type="date"
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
        <Field label="Supporting document">
          <label className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-silver bg-frost px-3 py-2.5 text-[13px] text-graphite hover:border-onyx/40">
            <UploadCloud className="h-4 w-4 text-steel" />
            <span>Upload evidence (PDF / image)</span>
            <input
              type="file"
              name="supporting_doc"
              accept="application/pdf,image/*"
              className="hidden"
            />
          </label>
        </Field>
        <div className="flex justify-end">
          <Submit />
        </div>
      </form>
    </details>
  );
}
