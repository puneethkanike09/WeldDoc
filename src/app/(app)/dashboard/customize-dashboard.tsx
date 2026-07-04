"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_WIDGET_GROUPS,
  widgetsForStandard,
  type DashboardWidgetGroup,
  type DashboardWidgetId,
} from "@/lib/dashboard/widgets";
import type { StandardSlug } from "@/lib/standards/catalog";
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Save as SaveIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

const CUSTOMIZE_STANDARDS: { slug: StandardSlug; label: string }[] = [
  { slug: "iso9606-1", label: "Welders — ISO 9606-1" },
  { slug: "iso-14732", label: "Operators — ISO 14732" },
];

type ItemState = { id: DashboardWidgetId; enabled: boolean };
type GroupState = Record<DashboardWidgetGroup, ItemState[]>;

function initGroupState(
  slug: StandardSlug,
  initialOrder: DashboardWidgetId[],
): GroupState {
  const catalog = widgetsForStandard(slug);
  const state = {} as GroupState;
  for (const group of DASHBOARD_WIDGET_GROUPS) {
    const groupIds = catalog.filter((w) => w.group === group).map((w) => w.id);
    const enabledOrdered = initialOrder.filter((id) =>
      (groupIds as string[]).includes(id),
    );
    const hidden = groupIds.filter((id) => !initialOrder.includes(id));
    state[group] = [
      ...enabledOrdered.map((id) => ({ id, enabled: true })),
      ...hidden.map((id) => ({ id, enabled: false })),
    ];
  }
  return state;
}

export function CustomizeDashboardButton({
  action,
  initialWelder,
  initialOperator,
}: {
  action: (fd: FormData) => Promise<void>;
  initialWelder: DashboardWidgetId[];
  initialOperator: DashboardWidgetId[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Customise your data
      </Button>
      {open ? (
        <CustomizeDialog
          action={action}
          initialWelder={initialWelder}
          initialOperator={initialOperator}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CustomizeDialog({
  action,
  initialWelder,
  initialOperator,
  onClose,
}: {
  action: (fd: FormData) => Promise<void>;
  initialWelder: DashboardWidgetId[];
  initialOperator: DashboardWidgetId[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<StandardSlug>("iso9606-1");
  const [stateBySlug, setStateBySlug] = useState<
    Record<string, GroupState>
  >(() => ({
    "iso9606-1": initGroupState("iso9606-1", initialWelder),
    "iso-14732": initGroupState("iso-14732", initialOperator),
  }));
  const [error, setError] = useState<string | null>(null);

  const dragItem = useRef<{ group: DashboardWidgetGroup; id: string } | null>(
    null,
  );

  const catalog = useMemo(() => widgetsForStandard(tab), [tab]);
  const labelById = useMemo(
    () =>
      Object.fromEntries(catalog.map((w) => [w.id, w])) as Record<
        string,
        { label: string; description: string }
      >,
    [catalog],
  );

  const groups = stateBySlug[tab];

  const toggle = useCallback(
    (group: DashboardWidgetGroup, id: DashboardWidgetId) => {
      setError(null);
      setStateBySlug((prev) => {
        const current = prev[tab];
        const nextItems = current[group].map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item,
        );
        return { ...prev, [tab]: { ...current, [group]: nextItems } };
      });
    },
    [tab],
  );

  const reorder = useCallback(
    (group: DashboardWidgetGroup, fromId: string, toId: string) => {
      if (fromId === toId) return;
      setStateBySlug((prev) => {
        const current = prev[tab];
        const items = [...current[group]];
        const fromIdx = items.findIndex((i) => i.id === fromId);
        const toIdx = items.findIndex((i) => i.id === toId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return { ...prev, [tab]: { ...current, [group]: items } };
      });
    },
    [tab],
  );

  const save = useCallback(() => {
    const fd = new FormData();
    for (const { slug } of CUSTOMIZE_STANDARDS) {
      const state = stateBySlug[slug];
      const ordered: string[] = [];
      for (const group of DASHBOARD_WIDGET_GROUPS) {
        for (const item of state[group]) {
          if (item.enabled) ordered.push(item.id);
        }
      }
      if (ordered.length === 0) {
        const label = CUSTOMIZE_STANDARDS.find((s) => s.slug === slug)!.label;
        setError(`Keep at least one block visible for ${label}.`);
        setTab(slug);
        return;
      }
      for (const id of ordered) fd.append(`widgets_${slug}`, id);
    }

    startTransition(async () => {
      try {
        await action(fd);
        toast.success("Dashboard layout saved.");
        router.refresh();
        onClose();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save layout.",
        );
      }
    });
  }, [action, onClose, router, stateBySlug]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Customise dashboard"
    >
      <div
        className="absolute inset-0 bg-onyx/40 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />

      <div className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-(--radius-card) border border-silver bg-panel shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-silver px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-onyx">
              Customise your data
            </h2>
            <p className="mt-1 text-sm text-graphite">
              Show, hide, and drag to reorder the cards and graphs on your
              dashboard. Applies to everyone in your organisation.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-charcoal hover:bg-onyx/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-silver px-6 py-3">
          {CUSTOMIZE_STANDARDS.map((entry) => (
            <button
              key={entry.slug}
              type="button"
              onClick={() => setTab(entry.slug)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                tab === entry.slug
                  ? "border-onyx bg-onyx text-parchment"
                  : "border-silver bg-panel text-charcoal hover:bg-frost/60",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="sleek-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {DASHBOARD_WIDGET_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel">
                {group}
              </p>
              <div className="space-y-1.5">
                {groups[group].map((item) => {
                  const meta = labelById[item.id];
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        dragItem.current = { group, id: item.id };
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const dragging = dragItem.current;
                        if (!dragging || dragging.group !== group) return;
                        reorder(group, dragging.id, item.id);
                      }}
                      onDragEnd={() => {
                        dragItem.current = null;
                      }}
                      className={cn(
                        "flex cursor-grab items-center gap-3 rounded-[10px] border px-3 py-2.5 transition-colors active:cursor-grabbing",
                        item.enabled
                          ? "border-silver bg-panel"
                          : "border-dashed border-silver/80 bg-frost/40 opacity-60",
                      )}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-steel" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-onyx">
                          {meta?.label ?? item.id}
                        </p>
                        <p className="truncate text-xs text-steel">
                          {meta?.description ?? ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={
                          item.enabled
                            ? `Hide ${meta?.label ?? item.id}`
                            : `Show ${meta?.label ?? item.id}`
                        }
                        title={item.enabled ? "Hide" : "Show"}
                        onClick={() => toggle(group, item.id)}
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-[8px] transition-colors",
                          item.enabled
                            ? "text-charcoal hover:bg-onyx/5"
                            : "text-steel hover:bg-onyx/5",
                        )}
                      >
                        {item.enabled ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-silver px-6 py-4">
          {error ? (
            <p className="text-sm text-expired-ink" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              Save layout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
