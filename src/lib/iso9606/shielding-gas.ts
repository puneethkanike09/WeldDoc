/** ISO 14175 shielding gas classifications (selection list). */
export const ISO_14175_GASES = [
  { code: "I1", label: "I1 — inert, low reactivity" },
  { code: "I2", label: "I2 — inert, moderate reactivity" },
  { code: "I3", label: "I3 — inert, high reactivity" },
  { code: "M12", label: "M12 — mixed, low oxidising" },
  { code: "M20", label: "M20 — mixed, moderate oxidising" },
  { code: "M21", label: "M21 — mixed, moderate oxidising (Ar + CO₂)" },
  { code: "M22", label: "M22 — mixed, moderate oxidising" },
  { code: "M23", label: "M23 — mixed, moderate oxidising" },
  { code: "M24", label: "M24 — mixed, moderate oxidising" },
  { code: "M25", label: "M25 — mixed, moderate oxidising" },
  { code: "M26", label: "M26 — mixed, moderate oxidising" },
  { code: "M27", label: "M27 — mixed, moderate oxidising" },
  { code: "M31", label: "M31 — mixed, high oxidising" },
  { code: "C1", label: "C1 — active, low oxidising" },
  { code: "C2", label: "C2 — active, moderate oxidising" },
  { code: "R1", label: "R1 — reducing" },
  { code: "N1", label: "N1 — nitrogen-based" },
  { code: "N2", label: "N2 — nitrogen-based" },
  { code: "N3", label: "N3 — nitrogen-based" },
  { code: "N4", label: "N4 — nitrogen-based" },
  { code: "N5", label: "N5 — nitrogen-based" },
  { code: "O1", label: "O1 — oxygen-based" },
  { code: "Z", label: "Z — other / not classified" },
] as const;

export function formatShieldingGas(code: string | null | undefined): string {
  if (!code) return "";
  if (/ISO\s*14175/i.test(code)) return code;
  return `ISO 14175 - ${code}`;
}

export function parseShieldingGasCode(stored: string | null | undefined): string {
  if (!stored) return "";
  const m = stored.match(/ISO\s*14175\s*[-–]\s*(.+)/i);
  return m ? m[1].trim() : stored.trim();
}
