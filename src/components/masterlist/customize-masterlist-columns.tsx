"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Save as SaveIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

type ColumnCatalogItem = {
  key: string;
  label: string;
  description: string;
};

type ItemState = { id: string; enabled: boolean };

function initColumnState(
  initialOrder: string[],
  allKeys: readonly string[],
): ItemState[] {
  const enabledOrdered = initialOrder.filter((id) => allKeys.includes(id));
  const hidden = allKeys.filter((id) => !initialOrder.includes(id));
  return [
    ...enabledOrdered.map((id) => ({ id, enabled: true })),
    ...hidden.map((id) => ({ id, enabled: false })),
  ];
}

export function CustomizeMasterListColumnsButton({
  action,
  initialColumns,
  catalog,
  allKeys,
  scopeLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  initialColumns: string[];
  catalog: readonly ColumnCatalogItem[];
  allKeys: readonly string[];
  scopeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const labelByKey = Object.fromEntries(catalog.map((c) => [c.key, c.label]));

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Customise columns
      </Button>
      {open ? (
        <CustomizeDialog
          action={action}
          initialColumns={initialColumns}
          allKeys={allKeys}
          labelByKey={labelByKey}
          metaByKey={Object.fromEntries(catalog.map((c) => [c.key, c]))}
          scopeLabel={scopeLabel}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CustomizeDialog({
  action,
  initialColumns,
  allKeys,
  labelByKey,
  metaByKey,
  scopeLabel,
  onClose,
}: {
  action: (fd: FormData) => Promise<void>;
  initialColumns: string[];
  allKeys: readonly string[];
  labelByKey: Record<string, string>;
  metaByKey: Record<string, ColumnCatalogItem>;
  scopeLabel: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<ItemState[]>(() =>
    initColumnState(initialColumns, allKeys),
  );
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);

  const toggle = useCallback((id: string) => {
    setError(null);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  }, []);

  const reorder = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setItems((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((i) => i.id === fromId);
      const toIdx = next.findIndex((i) => i.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    const ordered = items.filter((i) => i.enabled).map((i) => i.id);
    if (ordered.length === 0) {
      setError("Keep at least one column visible.");
      return;
    }

    const fd = new FormData();
    for (const id of ordered) fd.append("columns", id);

    startTransition(async () => {
      try {
        await action(fd);
        toast.success("Master list columns saved.");
        router.refresh();
        onClose();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save columns.",
        );
      }
    });
  }, [action, items, onClose, router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Customise master list columns"
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
              Customise master list columns
            </h2>
            <p className="mt-1 text-sm text-graphite">
              Show, hide, and drag to reorder the columns in your {scopeLabel}{" "}
              and exports. Applies to everyone in your organisation.
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

        <div className="sleek-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto px-6 py-5">
          {items.map((item) => {
            const meta = metaByKey[item.id];
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  dragId.current = item.id;
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const dragging = dragId.current;
                  if (!dragging) return;
                  reorder(dragging, item.id);
                }}
                onDragEnd={() => {
                  dragId.current = null;
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
                    {labelByKey[item.id] ?? item.id}
                  </p>
                  <p className="truncate text-xs text-steel">
                    {meta?.description ?? ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={
                    item.enabled
                      ? `Hide ${labelByKey[item.id] ?? item.id}`
                      : `Show ${labelByKey[item.id] ?? item.id}`
                  }
                  title={item.enabled ? "Hide" : "Show"}
                  onClick={() => toggle(item.id)}
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
