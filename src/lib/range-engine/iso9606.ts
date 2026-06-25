import rules from "./iso9606.rules.json";
import { POSITION_LABELS } from "@/lib/iso9606/constants";

export interface RangeInput {
  jointType: "BW" | "FW";
  product: "Plate" | "Pipe" | "Branch" | "Other";
  /** Material thickness (mm) — Table 8 for fillet. */
  testThicknessMm?: number | null;
  /** Deposited thickness (mm) — Table 6 for butt / branch. */
  depositedThicknessMm?: number | null;
  pipeOdMm?: number | null;
  position?: string | null;
  /** ISO 9606-1 parent group major number (1–11). */
  materialGroup?: string | null;
  /** Butt test with supplementary fillet extends joint coverage to FW. */
  supplementaryFillet?: boolean;
  /** Extended joint label (Lap, Overlay, …) — no ISO thickness range. */
  jointTypeExtended?: string | null;
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
  /** Absolute minimum qualified thickness / diameter (mm). */
  minAbsolute?: number;
  /** Floor when minFactor × value would be lower (Table 7, D > 25 mm). */
  minFloor?: number;
  unlimited?: boolean;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Inclusive lower bound, exclusive upper bound — matches ISO table row boundaries. */
function pickBand(bands: Band[], value: number): Band | null {
  for (const b of bands) {
    const aboveMin = b.min === undefined ? true : value >= b.min;
    const belowMax = b.max === undefined ? true : value < b.max;
    if (aboveMin && belowMax) return b;
  }
  return null;
}

function applyThicknessBands(t: number, bands: Band[]) {
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

function applyPipeOd(D: number, bands: Band[]) {
  const band = pickBand(bands, D);
  if (!band) return { min: round(D), unlimited: false };
  let min: number;
  if (band.minAbsolute !== undefined) {
    min = band.minAbsolute;
  } else if (band.minFactor !== undefined) {
    min = round(band.minFactor * D);
    if (band.minFloor !== undefined) min = Math.max(min, band.minFloor);
  } else {
    min = round(D);
  }
  return { min, unlimited: Boolean(band.unlimited) };
}

function isEnumJointOnly(jointTypeExtended: string | null | undefined): boolean {
  return !jointTypeExtended || jointTypeExtended === "BW" || jointTypeExtended === "FW";
}

function resolveApprovedJointTypes(input: RangeInput): string[] {
  if (input.jointType === "FW") return ["FW"];
  if (input.supplementaryFillet) return ["BW", "FW"];
  return ["BW"];
}

export function computeRange(input: RangeInput): RangeResult {
  const r = rules as unknown as {
    thickness: { bands: Band[] };
    filletThroat: { bands: Band[] };
    pipeOd: { bands: Band[]; plateQualifiesPipeOdMin: number };
    positionMapBw: Record<string, string[]>;
    positionMapFw: Record<string, string[]>;
    materialGroupMap: Record<string, string[]>;
  };

  const skipThicknessRange =
    input.product === "Other" && !isEnumJointOnly(input.jointTypeExtended);

  let thicknessMin: number | null = null;
  let thicknessMax: number | null = null;
  let thicknessUnlimited = false;

  if (!skipThicknessRange) {
    if (input.jointType === "FW") {
      const t = input.testThicknessMm ?? 0;
      if (t > 0) {
        const res = applyThicknessBands(t, r.filletThroat.bands);
        thicknessMin = res.min;
        thicknessMax = res.max;
        thicknessUnlimited = res.unlimited;
      }
    } else {
      const s = input.depositedThicknessMm ?? input.testThicknessMm ?? 0;
      if (s > 0) {
        const res = applyThicknessBands(s, r.thickness.bands);
        thicknessMin = res.min;
        thicknessMax = res.max;
        thicknessUnlimited = res.unlimited;
      }
    }
  }

  let pipeOdMin: number | null = null;
  let pipeOdUnlimited = false;
  const isPipeProduct =
    input.product === "Pipe" || input.product === "Branch";

  if (
    !skipThicknessRange &&
    isPipeProduct &&
    input.pipeOdMm &&
    input.pipeOdMm > 0
  ) {
    const od = applyPipeOd(input.pipeOdMm, r.pipeOd.bands);
    pipeOdMin = od.min;
    pipeOdUnlimited = od.unlimited;
  } else if (!skipThicknessRange && input.product === "Plate") {
    pipeOdMin = r.pipeOd.plateQualifiesPipeOdMin;
    pipeOdUnlimited = true;
  }

  const positionMap =
    input.jointType === "FW" ? r.positionMapFw : r.positionMapBw;
  const approvedPositions = input.position
    ? (positionMap[input.position] ?? [input.position])
    : [];

  const majorGroup = input.materialGroup?.split(".")[0] ?? input.materialGroup;
  const approvedMaterialGroups = majorGroup
    ? (r.materialGroupMap[majorGroup] ?? [majorGroup])
    : [];

  const approvedJointTypes = resolveApprovedJointTypes(input);

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
