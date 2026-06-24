import rules from "./iso9606.rules.json";
import { POSITION_LABELS } from "@/lib/iso9606/constants";

export interface RangeInput {
  jointType: "BW" | "FW";
  product: "Plate" | "Pipe" | "Branch" | "Other";
  testThicknessMm?: number | null;
  depositedThicknessMm?: number | null;
  pipeOdMm?: number | null;
  position?: string | null;
  materialGroup?: string | null;
}

export interface RangeResult {
  thicknessMin: number | null;
  thicknessMax: number | null;
  thicknessUnlimited: boolean;
  pipeOdMin: number | null;
  pipeOdUnlimited: boolean;
  approvedPositions: string[];
  approvedMaterialGroups: string[];
  approvedJointTypes: string[];
  summary: string;
}

interface Band {
  min?: number;
  max?: number;
  minFactor?: number;
  maxFactor?: number;
  minAbsolute?: number;
  unlimited?: boolean;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function pickBand(bands: Band[], t: number): Band | null {
  for (const b of bands) {
    const aboveMin = b.min === undefined ? true : t > b.min;
    const belowMax = b.max === undefined ? true : t <= b.max;
    if (aboveMin && belowMax) return b;
  }
  return null;
}

function applyThickness(t: number, bands: Band[]) {
  const band = pickBand(bands, t);
  if (!band) return { min: round(t), max: round(t), unlimited: false };
  const min =
    band.minAbsolute !== undefined
      ? band.minAbsolute
      : band.minFactor !== undefined
        ? round(band.minFactor * t)
        : round(t);
  const max = band.unlimited
    ? null
    : band.maxFactor !== undefined
      ? round(band.maxFactor * t)
      : round(t);
  return { min, max, unlimited: Boolean(band.unlimited) };
}

export function computeRange(input: RangeInput): RangeResult {
  const r = rules as unknown as {
    thickness: { bands: Band[] };
    pipeOd: { bands: Band[]; plateQualifiesPipeOdMin: number };
    positionMapBw: Record<string, string[]>;
    positionMapFw: Record<string, string[]>;
    materialGroupMap: Record<string, string[]>;
    jointTypeMap: Record<string, string[]>;
  };

  // Governing thickness: test thickness for butt; deposited/throat for fillet.
  const t =
    input.jointType === "FW"
      ? input.depositedThicknessMm ?? input.testThicknessMm ?? 0
      : input.testThicknessMm ?? 0;

  let thicknessMin: number | null = null;
  let thicknessMax: number | null = null;
  let thicknessUnlimited = false;
  if (t > 0) {
    const res = applyThickness(t, r.thickness.bands);
    thicknessMin = res.min;
    thicknessMax = res.max;
    thicknessUnlimited = res.unlimited;
  }

  // Pipe OD coverage.
  let pipeOdMin: number | null = null;
  let pipeOdUnlimited = false;
  const isPipe = input.product === "Pipe" || input.product === "Branch";
  if (isPipe && input.pipeOdMm && input.pipeOdMm > 0) {
    const band = pickBand(r.pipeOd.bands, input.pipeOdMm);
    if (band) {
      pipeOdMin =
        band.minAbsolute !== undefined
          ? band.minAbsolute
          : band.minFactor !== undefined
            ? round(band.minFactor * input.pipeOdMm)
            : round(input.pipeOdMm);
      pipeOdUnlimited = Boolean(band.unlimited);
    }
  } else if (!isPipe) {
    // Plate test qualifies pipe of large diameter.
    pipeOdMin = r.pipeOd.plateQualifiesPipeOdMin;
    pipeOdUnlimited = true;
  }

  const positionMap =
    input.jointType === "FW" ? r.positionMapFw : r.positionMapBw;
  const approvedPositions = input.position
    ? (positionMap[input.position] ?? [input.position])
    : [];

  const approvedMaterialGroups = input.materialGroup
    ? (r.materialGroupMap[input.materialGroup] ?? [input.materialGroup])
    : [];

  const approvedJointTypes = r.jointTypeMap[input.jointType] ?? [
    input.jointType,
  ];

  const result: RangeResult = {
    thicknessMin,
    thicknessMax,
    thicknessUnlimited,
    pipeOdMin,
    pipeOdUnlimited,
    approvedPositions,
    approvedMaterialGroups,
    approvedJointTypes,
    summary: "",
  };
  result.summary = buildSummary(result);
  return result;
}

export function buildSummary(r: RangeResult): string {
  const parts: string[] = [];

  if (r.thicknessMin !== null) {
    if (r.thicknessUnlimited) {
      parts.push(`thickness ≥ ${r.thicknessMin} mm`);
    } else if (r.thicknessMax !== null) {
      parts.push(`thickness ${r.thicknessMin}–${r.thicknessMax} mm`);
    }
  }

  if (r.pipeOdMin !== null) {
    parts.push(
      r.pipeOdUnlimited
        ? `pipe OD ≥ ${r.pipeOdMin} mm`
        : `pipe OD from ${r.pipeOdMin} mm`,
    );
  }

  if (r.approvedPositions.length) {
    parts.push(`positions ${r.approvedPositions.join(", ")}`);
  }

  if (r.approvedMaterialGroups.length) {
    parts.push(`material groups ${r.approvedMaterialGroups.join(", ")}`);
  }

  if (r.approvedJointTypes.length) {
    const jt = r.approvedJointTypes
      .map((j) => (j === "BW" ? "butt" : "fillet"))
      .join(" & ");
    parts.push(`${jt} welds`);
  }

  return parts.length
    ? `Approved for: ${parts.join(" · ")}.`
    : "Range pending test parameters.";
}

export function positionLabel(code: string): string {
  return POSITION_LABELS[code] ?? code;
}
