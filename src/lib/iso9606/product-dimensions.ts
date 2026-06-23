import type { JointCategory, ProductType } from "@/types/db";

export type BranchConnection = "set_in" | "set_on" | "set_through";

export type OtherJointType =
  | "BW"
  | "FW"
  | "Lap"
  | "Edge"
  | "Corner"
  | "Overlay"
  | "Product Base";

const ENUM_JOINTS = new Set<string>(["BW", "FW"]);

/** Form value → DB: enum column (BW/FW) + optional extended label (Lap, Edge, …). */
export function resolveJointStorage(raw: string): {
  joint_type: JointCategory;
  joint_type_extended: string | null;
} {
  const joint = raw.trim() || "BW";
  if (joint === "BW" || joint === "FW") {
    return { joint_type: joint, joint_type_extended: null };
  }
  return { joint_type: "BW", joint_type_extended: joint };
}

export function displayJointType(wpq: {
  joint_type: string;
  joint_type_extended?: string | null;
}): string {
  return wpq.joint_type_extended ?? wpq.joint_type;
}

export function isEnumJoint(raw: string): raw is JointCategory {
  return ENUM_JOINTS.has(raw);
}

export type DimensionFieldKey = "thickness" | "width" | "length" | "diameter" | "freeText";

export interface MaterialDimensionBlock {
  title: string;
  fields: DimensionFieldKey[];
  /** Form field prefix — material 1 uses legacy names where applicable. */
  material: 1 | 2;
}

export const BRANCH_CONNECTIONS: { value: BranchConnection; label: string }[] = [
  { value: "set_in", label: "Branch (set in)" },
  { value: "set_on", label: "Branch (set on)" },
  { value: "set_through", label: "Branch (set through)" },
];

export const OTHER_JOINT_TYPES: { value: OtherJointType; label: string }[] = [
  { value: "BW", label: "Butt weld (BW)" },
  { value: "FW", label: "Fillet weld (FW)" },
  { value: "Lap", label: "Lap" },
  { value: "Edge", label: "Edge" },
  { value: "Corner", label: "Corner" },
  { value: "Overlay", label: "Overlay" },
  { value: "Product Base", label: "Product base" },
];

const PLATE_BLOCK: MaterialDimensionBlock[] = [
  { title: "Material 1", fields: ["thickness", "width", "length"], material: 1 },
  { title: "Material 2", fields: ["thickness", "width", "length"], material: 2 },
];

const PIPE_BW: MaterialDimensionBlock[] = [
  { title: "Material 1", fields: ["thickness", "diameter", "length"], material: 1 },
  { title: "Material 2", fields: ["thickness", "diameter", "length"], material: 2 },
];

const PIPE_FW: MaterialDimensionBlock[] = [
  { title: "Material 1", fields: ["thickness", "diameter", "length"], material: 1 },
  {
    title: "Material 2 (plate)",
    fields: ["thickness", "width", "length"],
    material: 2,
  },
];

const BRANCH_BW: MaterialDimensionBlock[] = [
  {
    title: "Material 1 (main)",
    fields: ["thickness", "diameter", "length"],
    material: 1,
  },
  {
    title: "Material 2 (branch)",
    fields: ["thickness", "diameter", "length"],
    material: 2,
  },
];

const OTHER_FREE: MaterialDimensionBlock[] = [
  { title: "Material 1", fields: ["freeText"], material: 1 },
  { title: "Material 2", fields: ["freeText"], material: 2 },
];

/** Dimension blocks per client registry matrix (standards/image.png). */
export function materialDimensionBlocks(
  product: ProductType,
  jointType: string,
): MaterialDimensionBlock[] {
  if (product === "Other") return OTHER_FREE;
  if (product === "Branch") return BRANCH_BW;
  if (product === "Pipe") {
    return jointType === "FW" ? PIPE_FW : PIPE_BW;
  }
  return PLATE_BLOCK;
}

export function usesFreeTextDimensions(product: ProductType): boolean {
  return product === "Other";
}

export function jointOptionsForProduct(product: ProductType): { value: string; label: string }[] {
  if (product === "Branch") {
    return [{ value: "BW", label: "Butt weld (BW)" }];
  }
  if (product === "Other") {
    return OTHER_JOINT_TYPES.map((j) => ({ value: j.value, label: j.label }));
  }
  return [
    { value: "BW", label: "Butt weld (BW)" },
    { value: "FW", label: "Fillet weld (FW)" },
  ];
}

export function fieldName(
  material: 1 | 2,
  key: DimensionFieldKey,
): string {
  if (key === "freeText") {
    return material === 1 ? "dimensions" : "dimensions2";
  }
  const map: Record<DimensionFieldKey, string> = {
    thickness: "dimension_thickness_mm",
    width: "dimension_width_mm",
    length: "dimension_length_mm",
    diameter: "pipe_od_mm",
    freeText: "dimensions",
  };
  if (material === 1) return map[key];
  const m2: Record<Exclude<DimensionFieldKey, "freeText">, string> = {
    thickness: "dimension2_thickness_mm",
    width: "dimension2_width_mm",
    length: "dimension2_length_mm",
    diameter: "dimension2_pipe_od_mm",
  };
  return m2[key as Exclude<DimensionFieldKey, "freeText">];
}

export function wpqDimensionValue(
  wpq:
    | {
        dimension_thickness_mm?: number | null;
        dimension_width_mm?: number | null;
        dimension_length_mm?: number | null;
        dimension2_thickness_mm?: number | null;
        dimension2_width_mm?: number | null;
        dimension2_length_mm?: number | null;
        dimension2_pipe_od_mm?: number | null;
        dimensions?: string | null;
        dimensions2?: string | null;
        pipe_od_mm?: number | null;
      }
    | null
    | undefined,
  material: 1 | 2,
  key: DimensionFieldKey,
): string | number | null | undefined {
  if (!wpq) return "";
  const name = fieldName(material, key);
  if (name === "dimension_thickness_mm") return wpq.dimension_thickness_mm;
  if (name === "dimension_width_mm") return wpq.dimension_width_mm;
  if (name === "dimension_length_mm") return wpq.dimension_length_mm;
  if (name === "pipe_od_mm") return wpq.pipe_od_mm;
  if (name === "dimension2_thickness_mm") return wpq.dimension2_thickness_mm;
  if (name === "dimension2_width_mm") return wpq.dimension2_width_mm;
  if (name === "dimension2_length_mm") return wpq.dimension2_length_mm;
  if (name === "dimension2_pipe_od_mm") return wpq.dimension2_pipe_od_mm;
  if (name === "dimensions") return wpq.dimensions;
  if (name === "dimensions2") return wpq.dimensions2;
  return "";
}

/** Validate required dimension fields for step 2. */
export function validateMaterialDimensions(
  formData: FormData,
  product: ProductType,
  jointType: JointCategory | string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const blocks = materialDimensionBlocks(product, jointType);

  const num = (v: FormDataEntryValue | null): number | null => {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const str = (v: FormDataEntryValue | null): string | null => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length ? s : null;
  };

  for (const block of blocks) {
    for (const key of block.fields) {
      const name = fieldName(block.material, key);
      if (key === "freeText") {
        if (!str(formData.get(name))) {
          errors[name] = `${block.title}: dimensions description is required.`;
        }
        continue;
      }
      if (num(formData.get(name)) == null) {
        const label =
          key === "thickness"
            ? "Thickness"
            : key === "width"
              ? "Width"
              : key === "length"
                ? "Length"
                : "Outside diameter";
        errors[name] = `${block.title}: ${label} (mm) is required.`;
      }
    }
  }

  return errors;
}
