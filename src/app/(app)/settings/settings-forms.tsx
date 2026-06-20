"use client";

import { useFormStatus } from "react-dom";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save as SaveIcon, UploadCloud, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Organization } from "@/types/db";

function Save({ label, icon: Icon }: { label: string; icon: LucideIcon }) {
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

export function OrgSettingsForm({
  org,
  action,
}: {
  org: Organization;
  action: (fd: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Company name">
          <Input name="name" defaultValue={org.name} />
        </Field>
        <Field label="Location code" hint="e.g. BBSR">
          <Input name="location_code" defaultValue={org.location_code ?? ""} />
        </Field>
        <Field label="Welder UID prefix">
          <Input name="uid_prefix" defaultValue={org.uid_prefix} />
        </Field>
        <Field label="Report number prefix" hint="e.g. SMS/BBSR/WPQ-">
          <Input name="report_prefix" defaultValue={org.report_prefix} />
        </Field>
        <Field
          label="Alert lead days"
          hint="Comma-separated, e.g. 30,7"
        >
          <Input
            name="alert_lead_days"
            defaultValue={(org.alert_lead_days ?? [30, 7]).join(",")}
          />
        </Field>
      </div>
      <Field
        label="Alert recipients"
        hint="One email per line or comma-separated"
      >
        <Textarea
          name="alert_emails"
          rows={3}
          defaultValue={(org.alert_emails ?? []).join("\n")}
          placeholder="engineer@plant.com"
        />
      </Field>
      <Field
        label="Company logo"
        hint="Shown on certificates and master list exports (PNG/JPG)"
      >
        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-silver bg-frost px-3 text-[13px] text-graphite hover:border-onyx/40">
          <UploadCloud className="h-4 w-4 text-steel" />
          <span>
            {org.logo_path ? "Replace logo" : "Upload company logo"}
          </span>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />
        </label>
      </Field>
      <div className="flex justify-end">
        <Save label="Save settings" icon={SaveIcon} />
      </div>
    </form>
  );
}

export function SignatoryForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input name="name" placeholder="Soumya R. Panda" required />
        </Field>
        <Field label="Role">
          <Select name="role" defaultValue="manufacturer">
            <option value="manufacturer">Manufacturer</option>
            <option value="examining_body">Examining body / TPI</option>
          </Select>
        </Field>
        <Field label="Designation">
          <Input name="designation" placeholder="Welding Engineer" />
        </Field>
        <Field label="Organisation">
          <Input name="organisation" placeholder="SMS India / TUV India" />
        </Field>
        <Field label="Signature image">
          <FileInput name="signature" label="Upload signature (PNG)" />
        </Field>
        <Field label="Stamp image">
          <FileInput name="stamp" label="Upload stamp (PNG)" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Save label="Add signatory" icon={UserPlus} />
      </div>
    </form>
  );
}

function FileInput({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-silver bg-frost px-3 text-[13px] text-graphite hover:border-onyx/40">
      <UploadCloud className="h-4 w-4 text-steel" />
      <span>{label}</span>
      <input type="file" name={name} accept="image/*" className="hidden" />
    </label>
  );
}
