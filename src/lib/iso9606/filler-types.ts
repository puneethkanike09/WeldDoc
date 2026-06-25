/** Table 4 — process 111 electrode covering types. */
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

/** Table 5 — all other processes. */
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

export function fillerTypesForProcess(process: string): readonly string[] {
  return process === "111" ? FILLER_TYPES_PROCESS_111 : FILLER_TYPES_TABLE_5;
}

export function fillerTypeCode(fillerType: string | null | undefined): string {
  if (!fillerType) return "";
  const paren = fillerType.match(/\(([A-Z])\)/);
  if (paren) return paren[1];
  const dash = fillerType.match(/^([A-Z]{1,2})\s*—/);
  return dash ? dash[1] : fillerType.charAt(0).toUpperCase();
}
