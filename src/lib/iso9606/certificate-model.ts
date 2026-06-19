import type {
  Organization,
  QualificationRecord,
  RangeOfApproval,
  Welder,
} from "@/types/db";

export interface CertRow {
  label: string;
  test: string;
  range: string;
}

function materialCode(group: string | null): string {
  if (!group) return "CS";
  if (["1", "2", "3"].includes(group)) return "CS"; // carbon / low-alloy steel
  if (["8", "10"].includes(group)) return "SS"; // stainless
  if (["4", "5", "6"].includes(group)) return "CrMo";
  return `M${group}`;
}

function productCode(product: string): string {
  return product === "Pipe" || product === "Branch" ? "T" : "P";
}

function weldTypeCode(jointTypes: string[]): string {
  const hasBW = jointTypes.includes("BW");
  const hasFW = jointTypes.includes("FW");
  if (hasBW && hasFW) return "BW/FW";
  return hasBW ? "BW" : "FW";
}

function layerCode(layer: string | null): string {
  if (!layer) return "sl";
  return /multi|ml/i.test(layer) ? "ml" : "sl";
}

function thicknessRangeText(r: RangeOfApproval | null): string {
  if (!r) return "—";
  if (r.thickness_unlimited && r.thickness_min_mm != null)
    return `≥ ${r.thickness_min_mm}`;
  if (r.thickness_min_mm != null && r.thickness_max_mm != null)
    return `${r.thickness_min_mm} – ${r.thickness_max_mm}`;
  return "—";
}

function pipeRangeText(r: RangeOfApproval | null): string {
  if (!r || r.pipe_od_min_mm == null) return "—";
  return r.pipe_od_unlimited
    ? `Fixed Pipe (D≥${r.pipe_od_min_mm}mm) / Rotating Pipe (D≥75mm for PA & PC)`
    : `D ≥ ${r.pipe_od_min_mm}mm`;
}

function productRangeText(
  product: string,
  r: RangeOfApproval | null,
): string {
  if (product === "Plate") {
    return r && r.pipe_od_min_mm != null
      ? `Plate & fixed Pipe (D≥${r.pipe_od_min_mm}mm) / Rotating Pipe (D≥75mm for PA & PC)`
      : "Plate";
  }
  return pipeRangeText(r);
}

export function buildDesignation(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): string {
  const jointTypes = range?.approved_joint_types?.length
    ? range.approved_joint_types
    : [wpq.joint_type];
  const positions = range?.approved_positions?.length
    ? range.approved_positions.join("/")
    : wpq.position ?? "";
  const thickness =
    wpq.deposited_thickness_mm ?? wpq.test_thickness_mm ?? null;

  return [
    "EN ISO 9606-1",
    wpq.process,
    productCode(wpq.product),
    weldTypeCode(jointTypes),
    wpq.filler_group ?? "FM1",
    thickness != null ? `s${thickness}` : "",
    positions,
    wpq.weld_details ?? "ss nb",
    layerCode(wpq.layer_type),
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildCertNo(
  org: Organization,
  welder: Welder,
  wpq: QualificationRecord,
): string {
  const base = (org.report_prefix || "WPQ-")
    .replace(/WPQ-?$/i, "")
    .replace(/\/$/, "");
  const ref = welder.welder_id || welder.uid;
  const pos = wpq.position ?? "PA";
  const mat = materialCode(wpq.base_material_group);
  return `${base}/${wpq.process}/${pos}(${mat})-${ref}`;
}

export function buildCertRows(
  wpq: QualificationRecord,
  range: RangeOfApproval | null,
): CertRow[] {
  const jointTypes = range?.approved_joint_types?.length
    ? range.approved_joint_types
    : [wpq.joint_type];
  const matGroups = range?.approved_material_groups?.length
    ? range.approved_material_groups.join(", ")
    : wpq.base_material_group ?? "—";
  const positions = range?.approved_positions?.length
    ? range.approved_positions.join(", ")
    : wpq.position ?? "—";

  return [
    {
      label: "Welding process(es)",
      test: wpq.process,
      range: wpq.process,
    },
    {
      label: "Transfer mode",
      test: wpq.transfer_mode ?? "—",
      range: wpq.transfer_mode ?? "—",
    },
    {
      label: "Product type (plate or pipe)",
      test: wpq.product,
      range: productRangeText(wpq.product, range),
    },
    {
      label: "Type of weld",
      test: jointTypes.join(", "),
      range: weldTypeCode(jointTypes).replace("/", ", "),
    },
    {
      label: "Parent material group(s) / subgroups",
      test: wpq.base_material_group ?? "—",
      range: matGroups,
    },
    {
      label: "Filler material group(s)",
      test: wpq.filler_group ?? "—",
      range: wpq.filler_group ?? "—",
    },
    {
      label: "Filler material (designation)",
      test: wpq.filler_designation ?? "—",
      range: wpq.filler_designation ?? "—",
    },
    {
      label: "Shielding gas",
      test: wpq.shielding_gas ?? "—",
      range: wpq.shielding_gas ?? "—",
    },
    { label: "Auxiliaries", test: "NA", range: "NA" },
    {
      label: "Type of current and polarity",
      test: wpq.current_polarity ?? "—",
      range: wpq.current_polarity ?? "—",
    },
    {
      label: "Material thickness (mm)",
      test: wpq.test_thickness_mm != null ? String(wpq.test_thickness_mm) : "—",
      range: thicknessRangeText(range),
    },
    {
      label: "Deposited thickness (mm)",
      test:
        wpq.deposited_thickness_mm != null
          ? String(wpq.deposited_thickness_mm)
          : "—",
      range: thicknessRangeText(range),
    },
    {
      label: "Outside pipe diameter (mm)",
      test: wpq.pipe_od_mm != null ? String(wpq.pipe_od_mm) : "NA",
      range: pipeRangeText(range),
    },
    {
      label: "Welding position",
      test: wpq.position ?? "—",
      range: positions,
    },
    {
      label: "Weld details",
      test: wpq.weld_details ?? "—",
      range: wpq.weld_details ?? "—",
    },
    {
      label: "Multi-layer / single layer (fillet)",
      test: layerCode(wpq.layer_type),
      range:
        layerCode(wpq.layer_type) === "ml" ? "sl, ml" : layerCode(wpq.layer_type),
    },
  ];
}
