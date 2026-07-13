import type { StandardSlug } from "@/lib/standards/catalog";

export type MasterListColumnsConfig = Partial<
  Record<StandardSlug, string[]>
>;

export function parseMasterListColumnsConfig(
  raw: unknown,
): MasterListColumnsConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: MasterListColumnsConfig = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    const enabled = value.filter((v): v is string => typeof v === "string");
    if (enabled.length > 0) {
      out[key as StandardSlug] = enabled;
    }
  }
  return out;
}

export function mergeMasterListColumnsConfig(
  raw: unknown,
  slug: StandardSlug,
  enabled: string[],
): MasterListColumnsConfig {
  return {
    ...parseMasterListColumnsConfig(raw),
    [slug]: enabled,
  };
}

export function normalizeColumnOrder(
  raw: unknown,
  slug: StandardSlug,
  allKeys: readonly string[],
): string[] {
  const defaults = [...allKeys];
  const config = parseMasterListColumnsConfig(raw);
  const stored = config[slug];
  if (!stored) return defaults;

  const enabledSet = new Set(
    stored.filter((id) => (allKeys as readonly string[]).includes(id)),
  );
  const ordered = allKeys.filter((key) => enabledSet.has(key));
  return ordered.length > 0 ? ordered : defaults;
}

export function columnDefsFromCatalog<
  T extends string,
  C extends { key: T; label: string },
>(order: T[], catalog: readonly C[]): { key: T; label: string }[] {
  const labelByKey = Object.fromEntries(
    catalog.map((c) => [c.key, c.label]),
  ) as Record<T, string>;

  return order.map((key) => ({ key, label: labelByKey[key] }));
}

export function columnMetaFromCatalog<
  T extends string,
  C extends { key: T; label: string; description: string },
>(key: T, catalog: readonly C[]) {
  return catalog.find((c) => c.key === key);
}
