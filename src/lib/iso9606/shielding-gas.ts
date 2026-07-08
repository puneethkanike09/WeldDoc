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

/** Marker for processes with no shielding gas (111, 121, 311, …). */
export const NO_SHIELDING_GAS = "N/A";

function isNoGas(value: string): boolean {
  return /^n\/?a$/i.test(value.trim());
}

export function formatShieldingGas(code: string | null | undefined): string {
  if (!code) return "";
  if (isNoGas(code)) return NO_SHIELDING_GAS;
  if (/ISO\s*14175/i.test(code)) return code.trim();
  return `ISO 14175 - ${code.trim()}`;
}

/** Dropdown options — value and label both use ISO 14175 - {code}. */
export const ISO_14175_GASES = ISO_14175_GAS_CODES.map((code) =>
  formatShieldingGas(code),
);

/** Dropdown options including the "N/A" choice for gasless processes. */
export const SHIELDING_GAS_OPTIONS = [NO_SHIELDING_GAS, ...ISO_14175_GASES];

export const DEFAULT_SHIELDING_GAS = formatShieldingGas("M21");

/** Processes that run without a shielding gas (flux/covered/oxy-fuel). */
const GASLESS_PROCESSES = new Set(["111", "114", "121", "125", "311"]);

export function processUsesShieldingGas(
  process: string | null | undefined,
): boolean {
  return Boolean(process && !GASLESS_PROCESSES.has(process.trim()));
}

/** Sensible default gas for a process — N/A when the process uses no gas. */
export function defaultShieldingGasForProcess(
  process: string | null | undefined,
): string {
  return processUsesShieldingGas(process) ? DEFAULT_SHIELDING_GAS : NO_SHIELDING_GAS;
}

export function parseShieldingGasCode(stored: string | null | undefined): string {
  if (!stored) return "";
  const m = stored.match(/ISO\s*14175\s*[-–]\s*(.+)/i);
  return m ? m[1].trim() : stored.trim();
}

export function normalizeShieldingGas(stored: string | null | undefined): string {
  if (!stored) return "";
  if (isNoGas(stored)) return NO_SHIELDING_GAS;
  return formatShieldingGas(parseShieldingGasCode(stored) || stored);
}
