"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import { useFormSubmit } from "@/lib/form-toast";
import { toast } from "sonner";
import { ALERT_FREQUENCY_OPTIONS } from "@/lib/expiry-alerts/frequency";
import type { Organization } from "@/types/db";

export function AlertEmailConfigDialog({
  org,
  action,
}: {
  org: Organization;
  action: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { onSubmit, pending } = useFormSubmit(async (fd) => {
    await action(fd);
    toast.success("Alert email configuration saved.");
    setOpen(false);
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button type="button" variant="subtle">
          <Bell className="h-4 w-4" /> Alert email configuration
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-onyx/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[16px] border border-border bg-popover p-6 text-popover-foreground shadow-(--shadow-lift) data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-sm text-steel hover:bg-onyx/5 hover:text-onyx"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <Dialog.Title className="font-display text-lg font-semibold text-onyx">
            Alert email configuration
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-graphite">
            Organisation-wide expiry and continuity reminders for welders and
            operators. Applies to both registries.
          </Dialog.Description>

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <Field
              label="Alert lead days"
              hint="Comma-separated — e.g. 30,7. Qualifications within these windows are included."
            >
              <Input
                name="alert_lead_days"
                defaultValue={(org.alert_lead_days ?? [30, 7]).join(",")}
              />
            </Field>

            <Field label="Email frequency">
              <Select
                name="alert_email_frequency"
                defaultValue={org.alert_email_frequency ?? "once"}
              >
                {ALERT_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-steel">
                {
                  ALERT_FREQUENCY_OPTIONS.find(
                    (o) =>
                      o.value === (org.alert_email_frequency ?? "once"),
                  )?.hint
                }
              </p>
            </Field>

            <Field
              label="Alert recipients"
              hint="One email per line or comma-separated"
            >
              <Textarea
                name="alert_emails"
                rows={4}
                defaultValue={(org.alert_emails ?? []).join("\n")}
                placeholder="engineer@plant.com"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" disabled={pending}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save configuration
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
