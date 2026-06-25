/** Extract designation code from filler type label (Table 4 / Table 5). */
export function fillerTypeCode(fillerType: string | null | undefined): string {
  if (!fillerType) return "";
  const paren = fillerType.match(/\(([A-Z])\)/);
  if (paren) return paren[1];
  const dash = fillerType.match(/^([A-Z]{1,2})\s*—/i);
  if (dash) return dash[1].toUpperCase();
  if (/^No filler/i.test(fillerType)) return "nm";
  return fillerType.charAt(0).toUpperCase();
}
