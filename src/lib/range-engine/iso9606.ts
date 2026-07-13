import rules from "./iso9606.rules.json" with { type: "json" };

export interface RangeInput {
  jointType: "BW" | "FW";
  product: "Plate" | "Pipe" | "Branch" | "Other";
  /** Material thickness t — Table 8 (fillet). */
  testThicknessMm?: number | null;
  /** Deposited thickness s — Table 6 (butt / branch). */
  depositedThicknessMm?: number | null;
  /** Welding process code — Table 6 footnotes c/d (311). */
  process?: string | null;
  /** Layer type — Table 6 footnote e (≥3 layers for s ≥ 12). */
  layer?: string | null;
  pipeOdMm?: number | null;
  position?: string | null;
  /** Parent material group major number (1–11). */
  materialGroup?: string | null;
  /** Filler material group FM1–FM6 — Table 3. */
  fillerGroup?: string | null;
  /** Filler type — Tables 4 & 5; nm = no filler test. */
  fillerType?: string | null;
  supplementaryFillet?: boolean;
  jointTypeExtended?: string | null;
  /**
   * Optional second welding process on the same butt test piece (ISO 9606-1
   * Table 1). Each process qualifies its own deposited-thickness range; the
   * stored range is the union of both. Ignored for fillet joints.
   */
  secondProcess?: {
    process?: string | null;
    depositedThicknessMm?: number | null;
    layer?: string | null;
    position?: string | null;
  } | null;
}

export interface RangeResult {
  thicknessMin: number | null;
  thicknessMax: number | null;
  thicknessUnlimited: boolean;
  pipeOdMin: number | null;
  pipeOdMax: number | null;
  pipeOdUnlimited: boolean;
  approvedPositions: string[];
  approvedMaterialGroups: string[];
  approvedJointTypes: string[];
  summary: string;
}

interface Band {
  min?: number;
  max?: number;
  note?: string;
}

type RulesJson = typeof rules & {
  thickness: { bands: Band[] };
  filletMaterial: { note?: string };
  pipeOd: {
    plateFixedPipeMinMm: number;
    plateRotatingPipeMinMm: number;
  };
  positionMapBw: Record<string, string[]>;
  positionMapFw: Record<string, string[]>;
  materialGroupMap: Record<string, string[]>;
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Table 6 — range of qualification for deposited thickness s (butt welds). */
export function computeTable6DepositedRange(
  s: number,
  opts?: { process?: string | null; layer?: string | null },
): { min: number; max: number | null; unlimited: boolean } {
  if (s <= 0) return { min: 0, max: 0, unlimited: false };

  const is311 = opts?.process === "311";

  if (s >= 12) {
    // Table 6 row s ≥ 12: qualified range is ≥ 3 mm (footnote e: test welded
    // in ≥3 layers; footnote f: per-process s for multi-process).
    return { min: 3, max: null, unlimited: true };
  }

  if (s >= 3) {
    const max = is311 ? round(1.5 * s) : round(2 * s);
    return { min: 3, max, unlimited: false };
  }

  const scaledMax = is311 ? 1.5 * s : 2 * s;
  const max = is311 ? round(scaledMax) : round(Math.max(3, scaledMax));
  return { min: round(s), max, unlimited: false };
}

/** Table 8 — material thickness t for fillet welds. */
export function computeTable8FilletRange(
  t: number,
): { min: number; max: number | null; unlimited: boolean } {
  if (t <= 0) return { min: 0, max: 0, unlimited: false };

  if (t >= 3) {
    return { min: 3, max: null, unlimited: true };
  }

  const max = round(Math.max(3, 2 * t));
  return { min: round(t), max, unlimited: false };
}

/** Table 7 — outside pipe diameter D. */
export function computeTable7PipeOdRange(
  D: number,
): { min: number; max: number | null; unlimited: boolean } {
  if (D <= 0) return { min: 0, max: 0, unlimited: false };

  if (D <= 25) {
    return { min: round(D), max: round(2 * D), unlimited: false };
  }

  return { min: round(Math.max(0.5 * D, 25)), max: null, unlimited: true };
}

export const STEEL_PARENT_MATERIAL_GROUPS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
] as const;

/** §5.6 — 142/311 without filler, or any nm-only test: parent range = test group only. */
export function isNoFillerQualificationTest(
  process: string | null | undefined,
  fillerType: string | null | undefined,
): boolean {
  if (process === "142") return true;
  if (fillerType && /^no filler|^nm$/i.test(fillerType.trim())) return true;
  if (
    process === "311" &&
    (!fillerType || /^no filler|^nm$/i.test(fillerType.trim()))
  ) {
    return true;
  }
  return false;
}

function resolveApprovedMaterialGroups(input: RangeInput): string[] {
  if (!isNoFillerQualificationTest(input.process, input.fillerType)) {
    return [...STEEL_PARENT_MATERIAL_GROUPS];
  }
  const major = input.materialGroup?.split(".")[0] ?? input.materialGroup;
  return major ? [major] : [];
}

function isStandardBwFw(jointTypeExtended: string | null | undefined): boolean {
  return !jointTypeExtended || jointTypeExtended === "BW" || jointTypeExtended === "FW";
}

function resolveApprovedJointTypes(input: RangeInput): string[] {
  if (input.jointType === "FW") return ["FW"];
  if (input.supplementaryFillet) return ["BW", "FW"];
  return ["BW"];
}

export function computeFilletMaterialRange(testThicknessMm: number) {
  if (testThicknessMm <= 0) {
    return { min: null, max: null, unlimited: false };
  }
  const res = computeTable8FilletRange(testThicknessMm);
  return { min: res.min, max: res.max, unlimited: res.unlimited };
}

export function formatFilletMaterialRangeText(testThicknessMm: number | null): string {
  if (testThicknessMm == null || testThicknessMm <= 0) return "—";
  const r = computeFilletMaterialRange(testThicknessMm);
  if (r.min == null) return "—";
  if (r.unlimited) return `>= ${r.min} mm`;
  if (r.max != null) return `${r.min} – ${r.max} mm`;
  return `>= ${r.min} mm`;
}

export function computeRange(input: RangeInput): RangeResult {
  const r = rules as unknown as RulesJson;

  const skipThicknessRange =
    input.product === "Other" && !isStandardBwFw(input.jointTypeExtended);

  let thicknessMin: number | null = null;
  let thicknessMax: number | null = null;
  let thicknessUnlimited = false;

  if (!skipThicknessRange) {
    if (input.jointType === "FW") {
      const t = input.testThicknessMm ?? 0;
      if (t > 0) {
        const res = computeTable8FilletRange(t);
        thicknessMin = res.min;
        thicknessMax = res.max;
        thicknessUnlimited = res.unlimited;
      }
    } else {
      const s = input.depositedThicknessMm ?? 0;
      if (s > 0) {
        const res = computeTable6DepositedRange(s, {
          process: input.process,
          layer: input.layer,
        });
        thicknessMin = res.min;
        thicknessMax = res.max;
        thicknessUnlimited = res.unlimited;
      }

      // Multi-process (Table 1): union process 1's range with process 2's.
      const s2 = input.secondProcess?.depositedThicknessMm ?? 0;
      if (input.secondProcess?.process && s2 > 0) {
        const res2 = computeTable6DepositedRange(s2, {
          process: input.secondProcess.process,
          layer: input.secondProcess.layer,
        });
        if (thicknessMin == null) {
          thicknessMin = res2.min;
          thicknessMax = res2.max;
          thicknessUnlimited = res2.unlimited;
        } else {
          thicknessMin = Math.min(thicknessMin, res2.min);
          thicknessUnlimited = thicknessUnlimited || res2.unlimited;
          thicknessMax = thicknessUnlimited
            ? null
            : Math.max(thicknessMax ?? 0, res2.max ?? 0);
        }
      }
    }
  }

  let pipeOdMin: number | null = null;
  let pipeOdMax: number | null = null;
  let pipeOdUnlimited = false;
  const isPipeProduct =
    input.product === "Pipe" || input.product === "Branch";

  if (!skipThicknessRange && isPipeProduct && input.pipeOdMm && input.pipeOdMm > 0) {
    const od = computeTable7PipeOdRange(input.pipeOdMm);
    pipeOdMin = od.min;
    pipeOdMax = od.max;
    pipeOdUnlimited = od.unlimited;
  } else if (!skipThicknessRange && input.product === "Plate") {
    pipeOdMin = r.pipeOd.plateFixedPipeMinMm;
    pipeOdUnlimited = true;
  }

  const positionMap =
    input.jointType === "FW" ? r.positionMapFw : r.positionMapBw;
  const approvedFromPosition = (pos: string | null | undefined): string[] =>
    pos ? (positionMap[pos] ?? [pos]) : [];

  let approvedPositions = approvedFromPosition(input.position);
  if (input.secondProcess?.position) {
    approvedPositions = [
      ...new Set([
        ...approvedPositions,
        ...approvedFromPosition(input.secondProcess.position),
      ]),
    ];
  }

  const approvedMaterialGroups = resolveApprovedMaterialGroups(input);

  const approvedJointTypes = resolveApprovedJointTypes(input);

  const result: RangeResult = {
    thicknessMin,
    thicknessMax,
    thicknessUnlimited,
    pipeOdMin,
    pipeOdMax,
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
    if (r.pipeOdMax != null) {
      parts.push(`pipe OD ${r.pipeOdMin}–${r.pipeOdMax} mm`);
    } else {
      parts.push(
        r.pipeOdUnlimited
          ? `pipe OD ≥ ${r.pipeOdMin} mm`
          : `pipe OD ≥ ${r.pipeOdMin} mm`,
      );
    }
  }

  if (r.approvedPositions.length) {
    parts.push(`positions ${r.approvedPositions.join(", ")}`);
  }

  if (r.approvedJointTypes.length) {
    parts.push(r.approvedJointTypes.join(" & "));
  }

  return parts.length
    ? `Approved for: ${parts.join(" · ")}.`
    : "Range pending test parameters.";
}

export function positionLabel(code: string): string {
  return code;
}
