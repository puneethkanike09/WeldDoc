"use client";

import { useCallback, useState } from "react";
import { Building2, CreditCard, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isSettingsTab,
  type SettingsTab,
} from "./settings-tab-ids";

const TAB_META: {
  id: SettingsTab;
  label: string;
  icon: typeof Building2;
}[] = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export function SettingsTabs({
  organisation,
  billing,
  appearance,
  initialTab = "organisation",
}: {
  organisation: React.ReactNode;
  billing: React.ReactNode;
  appearance: React.ReactNode;
  initialTab?: SettingsTab;
}) {
  const [tab, setTab] = useState<SettingsTab>(
    isSettingsTab(initialTab) ? initialTab : "organisation",
  );

  const selectTab = useCallback((next: SettingsTab) => {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url);
    } catch {
      // best-effort deep-link sync
    }
  }, []);

  const panels: Record<SettingsTab, React.ReactNode> = {
    organisation,
    billing,
    appearance,
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Settings sections"
        className="flex flex-wrap gap-1 rounded-button bg-frost p-1"
      >
        {TAB_META.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`settings-tab-${id}`}
              aria-selected={active}
              aria-controls={`settings-panel-${id}`}
              onClick={() => selectTab(id)}
              className={cn(
                "flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-segment-active-bg text-segment-active-fg shadow-sm"
                  : "text-charcoal hover:text-onyx",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
      >
        {panels[tab]}
      </div>
    </div>
  );
}
