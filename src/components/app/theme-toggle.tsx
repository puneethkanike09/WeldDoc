"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppTheme, type AppTheme } from "@/components/app/app-theme-provider";

const options: { value: AppTheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useAppTheme();

  if (compact) {
    return (
      <div className="flex items-center gap-1 rounded-[10px] bg-frost p-1">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-[8px] transition-colors",
              theme === value
                ? "bg-panel text-onyx shadow-sm"
                : "text-steel hover:text-charcoal",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors",
            theme === value
              ? "border-inverse-bg bg-inverse-bg text-inverse-fg"
              : "border-silver bg-panel text-charcoal hover:bg-frost/60",
          )}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="font-display text-[14px] font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
