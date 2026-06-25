/** Range text helpers for weld details, layer, and transfer mode (ISO 9606-1 §11). */

export function layerCode(layer: string | null): string {
  if (!layer) return "sl";
  return /multi|ml/i.test(layer) ? "ml" : "sl";
}

/** Multi-layer test qualifies single- and multi-layer; single-layer only qualifies sl. */
export function layerRangeText(layer: string | null): string {
  const code = layerCode(layer);
  return code === "ml" ? "sl & ml" : "sl";
}

/**
 * Certificate range shows only the detail suffix (e.g. nb, mb, gg) — not the full
 * designation fragment (client: "whichever in the bracket only").
 */
export function weldDetailsRangeText(test: string | null): string {
  if (!test) return "—";
  const parts = test.trim().toLowerCase().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return parts[parts.length - 1] ?? test;
}

/** GMAW transfer mode range equals the tested mode; N/A for non-GMAW processes. */
export function transferModeRangeText(
  mode: string | null,
  process: string,
): string {
  if (!mode || mode === "N/A") return "N/A";
  const gmaW = ["131", "135", "138"].includes(process);
  if (!gmaW) return "N/A";
  return mode;
}

export function formatRangeWithTable(range: string, tableRef?: string): string {
  if (!tableRef || range === "—" || range === "NA") return range;
  return `${range} · ${tableRef}`;
}
