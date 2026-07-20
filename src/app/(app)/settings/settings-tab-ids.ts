export const SETTINGS_TABS = ["organisation", "billing", "appearance"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export function parseSettingsTab(tab: string | undefined): SettingsTab {
  if (tab && (SETTINGS_TABS as readonly string[]).includes(tab)) {
    return tab as SettingsTab;
  }
  return "organisation";
}

export function isSettingsTab(value: string | undefined): value is SettingsTab {
  return typeof value === "string" && (SETTINGS_TABS as readonly string[]).includes(value);
}
