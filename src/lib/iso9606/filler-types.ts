/**
 * EN ISO 9606-1:2017 — filler material type (§5.6, Tables 4 & 5).
 * Certificate range column shows qualified types only — no table references.
 */

/** Table 4 — process 111 covered electrode covering types. */
export const FILLER_TYPES_PROCESS_111 = [
  "A — acid",
  "RA — rutile-acid",
  "RB — rutile-basic",
  "RC — rutile-cellulosic",
  "RR — rutile-rutile",
  "R — rutile",
  "B — basic",
  "C — cellulosic",
] as const;

/** Table 5 — all other processes with filler. */
export const FILLER_TYPES_TABLE_5 = [
  "Solid wire/rod (S)",
  "Metal-cored (M)",
  "Flux-cored (B)",
  "Flux-cored (R)",
  "Flux-cored (P)",
  "Flux-cored (V)",
  "Flux-cored (W)",
  "Flux-cored (Y)",
  "Flux-cored (Z)",
] as const;

const TABLE4_GROUP1 = ["A", "RA", "RB", "RC", "RR", "R"] as const;
const TABLE4_GROUP2 = ["B"] as const;
const TABLE4_GROUP3 = ["C"] as const;
const TABLE5_SOLID = ["S", "M"] as const;
const TABLE5_FLUX_BASIC = ["B"] as const;
const TABLE5_FLUX_OTHER = ["R", "P", "V", "W", "Y", "Z"] as const;

const NO_FILLER_PROCESSES = new Set(["142", "311"]);

/** Dropdown options for the selected welding process. */
export function fillerTypesForProcess(process: string): readonly string[] {
  if (process === "111") return FILLER_TYPES_PROCESS_111;
  if (NO_FILLER_PROCESSES.has(process)) {
    return ["No filler (nm)", ...FILLER_TYPES_TABLE_5];
  }
  return FILLER_TYPES_TABLE_5;
}

/** Designation suffix code for the welder designation string (§4). */
export function fillerTypeCode(fillerType: string | null | undefined): string {
  if (!fillerType) return "";
  if (/^No filler/i.test(fillerType)) return "nm";
  const paren = fillerType.match(/\(([A-Z]{1,2})\)/);
  if (paren) return paren[1].toUpperCase();
  const dash = fillerType.match(/^([A-Z]{1,2})\s*—/i);
  if (dash) return dash[1].toUpperCase();
  return fillerType.charAt(0).toUpperCase();
}

function table4QualifiedCodes(testCode: string): string[] {
  const code = testCode.toUpperCase();
  if (code === "B") return [...TABLE4_GROUP1, ...TABLE4_GROUP2];
  if (code === "C") return [...TABLE4_GROUP3];
  if ((TABLE4_GROUP1 as readonly string[]).includes(code)) return [...TABLE4_GROUP1];
  return [code];
}

function table5QualifiedCodes(testCode: string): string[] {
  const code = testCode.toUpperCase();
  if (code === "NM") return ["nm"];
  if ((TABLE5_SOLID as readonly string[]).includes(code)) return [...TABLE5_SOLID];
  if ((TABLE5_FLUX_BASIC as readonly string[]).includes(code)) {
    return [...TABLE5_FLUX_BASIC, ...TABLE5_FLUX_OTHER];
  }
  if ((TABLE5_FLUX_OTHER as readonly string[]).includes(code)) {
    return [...TABLE5_FLUX_OTHER];
  }
  return [code];
}

/** Human-readable qualified filler types for the certificate range column. */
export function fillerTypeQualificationRange(
  fillerType: string | null | undefined,
  process: string,
): string {
  if (!fillerType) return "—";
  const testCode = fillerTypeCode(fillerType);
  if (!testCode) return "—";

  if (testCode === "nm") return "No filler (nm)";

  const codes =
    process === "111"
      ? table4QualifiedCodes(testCode)
      : table5QualifiedCodes(testCode);

  // §5.6 — welding with filler also qualifies for welding without filler, but
  // "without filler" only exists for processes that can run without a
  // consumable (see NOTE: 142, 311). Wire/electrode processes (111, 135, …)
  // cannot be welded without filler, so "nm" must not be added there.
  const qualified = NO_FILLER_PROCESSES.has(process) ? [...codes, "nm"] : codes;
  return qualified.join(", ");
}
