/**
 * Map client Excel process / joint cells into WeldDoc Option A storage shape.
 */

export type ClientJointMode = "BW" | "FW" | "BW_FW";

export function parseClientProcesses(raw: string | null): {
  process: string;
  process2: string | null;
} | null {
  if (!raw?.trim()) return null;
  const cleaned = raw.trim().replace(/\s+/g, "");
  const parts = cleaned.split("+").filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return null;
  if (parts.length === 1) return { process: parts[0], process2: null };
  if (parts[0] === parts[1]) return null;
  return { process: parts[0], process2: parts[1] };
}

export function parseClientJointMode(raw: string | null): ClientJointMode | null {
  if (!raw?.trim()) return null;
  const t = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (t === "BW") return "BW";
  if (t === "FW") return "FW";
  if (t === "BW/FW" || t === "BW+FW" || t === "BWFW") return "BW_FW";
  return null;
}

/** Treat NA / empty as unused. */
export function clientCellOrNull(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t || /^n\/?a$/i.test(t) || t === "-" || t === "--") return null;
  return t;
}

export function parseClientThickness(
  raw: string | null | undefined,
): number | null {
  const t = clientCellOrNull(raw);
  if (t == null) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
