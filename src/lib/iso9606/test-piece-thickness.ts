import type { JointCategory, ProductType } from "@/types/db";

/**
 * EN ISO 9606-1 §5.4 d) — joints that cannot be qualified as standard butt/fillet
 * (Lap, Overlay, Edge, … on “Others” product) use a specific test piece; Tables 6–8
 * thickness ranges do not apply (see also range-engine skipThicknessRange).
 */
export function usesIsoThicknessTables(
  product: ProductType,
  jointLabel: string,
): boolean {
  if (product !== "Other") return true;
  return jointLabel === "BW" || jointLabel === "FW";
}

/** §5.7 + Table 8 — fillet qualification range is based on material thickness t. */
export function showTestThicknessField(
  product: ProductType,
  jointType: JointCategory,
  jointLabel: string,
): boolean {
  if (!usesIsoThicknessTables(product, jointLabel)) return false;
  return jointType === "FW";
}

/** §5.7 + Table 6 — butt qualification range is based on deposited thickness s. */
export function showDepositedThicknessField(
  product: ProductType,
  jointType: JointCategory,
  jointLabel: string,
): boolean {
  if (!usesIsoThicknessTables(product, jointLabel)) return false;
  return jointType !== "FW";
}
