/** ISO 14175 shielding gas classifications (selection list). */
export const ISO_14175_GAS_CODES = [
  "I1",
  "I2",
  "I3",
  "M12",
  "M20",
  "M21",
  "M22",
  "M23",
  "M24",
  "M25",
  "M26",
  "M27",
  "M31",
  "C1",
  "C2",
  "R1",
  "N1",
  "N2",
  "N3",
  "N4",
  "N5",
  "O1",
  "Z",
] as const;

export function formatShieldingGas(code: string | null | undefined): string {
  if (!code) return "";
  if (/ISO\s*14175/i.test(code)) return code.trim();
  return `ISO 14175 - ${code.trim()}`;
}

/** Dropdown options — value and label both use ISO 14175 - {code}. */
export const ISO_14175_GASES = ISO_14175_GAS_CODES.map((code) =>
  formatShieldingGas(code),
);

export const DEFAULT_SHIELDING_GAS = formatShieldingGas("M21");

export function parseShieldingGasCode(stored: string | null | undefined): string {
  if (!stored) return "";
  const m = stored.match(/ISO\s*14175\s*[-–]\s*(.+)/i);
  return m ? m[1].trim() : stored.trim();
}

export function normalizeShieldingGas(stored: string | null | undefined): string {
  if (!stored) return "";
  return formatShieldingGas(parseShieldingGasCode(stored) || stored);
}
