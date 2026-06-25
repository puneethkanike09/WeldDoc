import type { JointCategory, ProductType } from "@/types/db";

/** Lap, Overlay, etc. on Others — Tables 6–8 do not apply (§5.4 d)). */
export function usesIsoThicknessTables(
  product: ProductType,
  jointLabel: string,
): boolean {
  if (product !== "Other") return true;
  return jointLabel === "BW" || jointLabel === "FW";
}

/** Table 8 — fillet: material thickness t. */
export function showTestThicknessField(
  product: ProductType,
  jointType: JointCategory,
  jointLabel: string,
): boolean {
  if (!usesIsoThicknessTables(product, jointLabel)) return false;
  return jointType === "FW";
}

/** Table 6 — butt: deposited thickness s. */
export function showDepositedThicknessField(
  product: ProductType,
  jointType: JointCategory,
  jointLabel: string,
): boolean {
  if (!usesIsoThicknessTables(product, jointLabel)) return false;
  return jointType !== "FW";
}
