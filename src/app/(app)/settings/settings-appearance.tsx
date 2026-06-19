"use client";

import { ThemeToggle } from "@/components/app/theme-toggle";

export function SettingsAppearance() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-graphite">
        Choose light, dark, or match your system preference. Saved on this
        device for the admin dashboard.
      </p>
      <ThemeToggle />
    </div>
  );
}
