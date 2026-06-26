"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import {
  ALL_DASHBOARD_WIDGET_IDS,
  normalizeDashboardWidgets,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import { Loader2, Save as SaveIcon } from "lucide-react";
import type { Organization } from "@/types/db";
import { DashboardLayoutPreview } from "./dashboard-layout-preview";

export function DashboardWidgetsForm({
  org,
  action,
}: {
  org: Organization;
  action: (fd: FormData) => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(
    () => new Set(normalizeDashboardWidgets(org.dashboard_widgets)),
  );
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback((id: DashboardWidgetId) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) {
          setError("Select at least one dashboard widget.");
          return prev;
        }
        next.delete(id);
      } else {
        next.add(id);
      }
      setError(null);
      return next;
    });
  }, []);

  const validate = useCallback((formData: FormData) => {
    const anyChecked = ALL_DASHBOARD_WIDGET_IDS.some(
      (id) => formData.get(`widget_${id}`) === "on",
    );
    if (!anyChecked) {
      const msg = "Select at least one dashboard widget.";
      setError(msg);
      return { widgets: msg };
    }
    setError(null);
    return {} as FieldErrors;
  }, []);

  const { onSubmit, pending } = useFormSubmit(action, validate);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <p className="text-sm text-graphite">
        Preview matches your dashboard layout. Click any block to show or hide
        it — sample data is shown for illustration. Settings apply to everyone
        in your organisation.
      </p>

      {ALL_DASHBOARD_WIDGET_IDS.map((id) =>
        enabled.has(id) ? (
          <input key={id} type="hidden" name={`widget_${id}`} value="on" />
        ) : null,
      )}

      <DashboardLayoutPreview enabled={enabled} onToggle={toggle} />

      {error ? (
        <p className="text-sm text-expired-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SaveIcon className="h-4 w-4" />
          )}
          Save dashboard layout
        </Button>
      </div>
    </form>
  );
}
