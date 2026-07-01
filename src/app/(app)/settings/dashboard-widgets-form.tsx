"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormSubmit } from "@/lib/form-toast";
import type { FieldErrors } from "@/lib/field-errors";
import {
  allWidgetIdsForStandard,
  normalizeDashboardWidgets,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import {
  WELDING_STANDARDS_CATALOG,
  type StandardSlug,
} from "@/lib/standards/catalog";
import { Loader2, Save as SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/db";
import { DashboardLayoutPreview } from "./dashboard-layout-preview";

const LAYOUT_STANDARDS = WELDING_STANDARDS_CATALOG.filter(
  (entry) => entry.status === "active",
);

export function DashboardWidgetsForm({
  org,
  action,
  initialStandard,
}: {
  org: Organization;
  action: (fd: FormData) => Promise<void>;
  initialStandard: StandardSlug;
}) {
  const [standard, setStandard] = useState<StandardSlug>(initialStandard);
  const [enabledByStandard, setEnabledByStandard] = useState(() => {
    const map = new Map<StandardSlug, Set<DashboardWidgetId>>();
    for (const entry of LAYOUT_STANDARDS) {
      map.set(
        entry.slug,
        new Set(normalizeDashboardWidgets(org.dashboard_widgets, entry.slug)),
      );
    }
    return map;
  });
  const [error, setError] = useState<string | null>(null);

  const enabled =
    enabledByStandard.get(standard) ??
    new Set(normalizeDashboardWidgets(org.dashboard_widgets, standard));

  const toggle = useCallback(
    (id: DashboardWidgetId) => {
      setEnabledByStandard((prev) => {
        const current =
          prev.get(standard) ??
          new Set(normalizeDashboardWidgets(org.dashboard_widgets, standard));
        const next = new Set(current);
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
        return new Map(prev).set(standard, next);
      });
    },
    [org.dashboard_widgets, standard],
  );

  const validate = useCallback(
    (formData: FormData) => {
      const widgetIds = allWidgetIdsForStandard(standard);
      const anyChecked = widgetIds.some(
        (id) => formData.get(`widget_${id}`) === "on",
      );
      if (!anyChecked) {
        const msg = "Select at least one dashboard widget.";
        setError(msg);
        return { widgets: msg };
      }
      setError(null);
      return {} as FieldErrors;
    },
    [standard],
  );

  const { onSubmit, pending } = useFormSubmit(action, validate);

  const widgetIds = allWidgetIdsForStandard(standard);
  const standardMeta = LAYOUT_STANDARDS.find((e) => e.slug === standard)!;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <input type="hidden" name="standard" value={standard} />

      <div className="flex flex-wrap gap-2">
        {LAYOUT_STANDARDS.map((entry) => (
          <button
            key={entry.slug}
            type="button"
            onClick={() => setStandard(entry.slug)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              standard === entry.slug
                ? "border-onyx bg-onyx text-parchment"
                : "border-silver bg-panel text-charcoal hover:bg-frost/60",
            )}
          >
            {entry.shortLabel}
          </button>
        ))}
      </div>

      <p className="text-sm text-graphite">
        Configure the dashboard for the{" "}
        <span className="font-medium text-onyx">{standardMeta.title}</span>{" "}
        workspace. Charts mirror master list dimensions — process, position, FM
        group, product, joint, thickness and pipe OD. Click any block to show or
        hide it. Settings apply to everyone in your organisation.
      </p>

      {widgetIds.map((id) =>
        enabled.has(id) ? (
          <input key={id} type="hidden" name={`widget_${id}`} value="on" />
        ) : null,
      )}

      <DashboardLayoutPreview
        standard={standard}
        enabled={enabled}
        onToggle={toggle}
      />

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
          Save {standardMeta.shortLabel} layout
        </Button>
      </div>
    </form>
  );
}
