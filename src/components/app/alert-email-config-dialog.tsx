"use client";

import { useState } from "react";
import { Bell, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Select } from "@/components/sui/select";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/sui/dialog";
import { useFormSubmit } from "@/lib/form-toast";
import { toast } from "sonner";
import { ALERT_FREQUENCY_OPTIONS } from "@/lib/expiry-alerts/frequency";
import {
  ALERT_TIMEZONE_OPTIONS,
  parseAlertEmailTime,
} from "@/lib/expiry-alerts/send-time";
import type { Organization } from "@/types/db";

/** Radix Select portals its listbox outside Dialog.Content; without this, dismissing the dropdown can close the dialog too. */
function keepDialogOpenOnNestedLayerPointer(event: {
  preventDefault(): void;
  currentTarget: EventTarget | null;
  target: EventTarget | null;
}) {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  if (
    event.currentTarget instanceof Node &&
    event.currentTarget.contains(target)
  ) {
    event.preventDefault();
    return;
  }

  if (
    target.closest('[role="listbox"]') ||
    target.closest("[data-radix-popper-content-wrapper]")
  ) {
    event.preventDefault();
  }
}

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="subtle">
          <Bell className="h-4 w-4" /> Alert email configuration
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={keepDialogOpenOnNestedLayerPointer}
        onPointerDownOutside={keepDialogOpenOnNestedLayerPointer}
      >
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <DialogHeader>
            <DialogCloseButton />
            <DialogTitle>Alert email configuration</DialogTitle>
            <DialogDescription>
              Organisation-wide expiry and continuity reminders for welders and
              operators. Applies to both registries.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-5">
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

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Send time"
                hint="Emails go out at this local time in the selected timezone. The scheduler must run at least every 10 minutes."
              >
                <Input
                  type="time"
                  name="alert_email_time"
                  defaultValue={parseAlertEmailTime(org.alert_email_time)}
                />
              </Field>

              <Field label="Timezone">
                <Select
                  name="alert_email_timezone"
                  defaultValue={org.alert_email_timezone ?? "Asia/Kolkata"}
                >
                  {ALERT_TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

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
          </DialogBody>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
