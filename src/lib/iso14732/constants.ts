import type {
  OperatorQualification,
  OperatorWeldingMode,
  OperatorWeldingType,
  TestResult,
} from "@/types/db";

export const TESTING_STANDARD = "ISO 14732:2025";

export const FUSION_PRODUCT_TYPES = [
  "Plate",
  "Pipe",
  "Branch",
  "Overlay",
  "Tube to Tube plate weld",
  "Product Base",
] as const;

export const RESISTANCE_PRODUCT_TYPES = ["Plate", "Pipe", "Product Base"] as const;

export const FUSION_JOINT_TYPES = ["BW", "FW", "Others"] as const;
export const RESISTANCE_JOINT_TYPES = [
  "Spot",
  "Seam",
  "Projection",
  "Upset Butt",
  "Flash Butt",
] as const;

export const WELDING_MODES = ["Mechanized", "Automatic"] as const;
export const WELDING_TYPES = ["Fusion", "Resistance"] as const;

export const REVALIDATION_METHODS = [
  { code: "6.3a" as const, label: "6.3a" },
  { code: "6.3b" as const, label: "6.3b" },
  { code: "6.3c" as const, label: "6.3c" },
] as const;

export const TECHNOLOGY_KNOWLEDGE = ["Acceptable", "Not_Acceptable"] as const;

export const QUALIFICATION_TEST_METHODS = [
  { code: "Method_1" as const, label: "Method 1 — ISO 9606-1 / ISO 9606-2" },
  { code: "Method_2" as const, label: "Method 2 — ISO 15614-8 (tube-to-tube-plate)" },
  { code: "Method_3" as const, label: "Method 3 — ISO 15614-7 (overlay)" },
  {
    code: "Method_4" as const,
    label: "Method 4 — Pre-production / production test piece",
  },
] as const;

export const METHOD1_STANDARDS = ["ISO 9606-1", "ISO 9606-2"] as const;

export const BACKING_TYPES = [
  "Flux Backing",
  "Gas Backing",
  "Metal Backing",
  "Weld Backing",
  "Ceramic Backing",
] as const;

export const VISUAL_REMOTE_OPTIONS = ["Visual Control", "Remote Control"] as const;
export const YES_NO_OPTIONS = ["Yes", "No"] as const;
export const YES_NO_NA_OPTIONS = ["Yes", "No", "NA"] as const;
export const SINGLE_MULTI_OPTIONS = ["Single Run", "Multi Run"] as const;
export const ORBITAL_POSITION_OPTIONS = [
  "Single position",
  "Multiple Position",
  "NA",
] as const;

const RT_BLOCKED_PROCESSES_9606_1 = new Set(["131", "135", "138"]);
const RT_BLOCKED_PROCESSES_9606_2 = new Set(["131"]);

export function processLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return code;
}

export function productTypesFor(
  weldingType: OperatorWeldingType | null | undefined,
): readonly string[] {
  if (weldingType === "Resistance") return RESISTANCE_PRODUCT_TYPES;
  return FUSION_PRODUCT_TYPES;
}

export function jointTypesFor(
  weldingType: OperatorWeldingType | null | undefined,
): readonly string[] {
  if (weldingType === "Resistance") return RESISTANCE_JOINT_TYPES;
  return FUSION_JOINT_TYPES;
}

export interface NdtTestSpec {
  method: string;
  label: string;
}

function isPlate(product: string | null | undefined): boolean {
  return product === "Plate" || product === "Product Base";
}

function isPipe(product: string | null | undefined): boolean {
  return product === "Pipe" || product === "Branch" || product === "Overlay";
}

function isBw(joint: string | null | undefined): boolean {
  return joint === "BW";
}

function isFw(joint: string | null | undefined): boolean {
  return joint === "FW";
}

function rtAllowed(
  standard: string | null | undefined,
  process: string | null | undefined,
): boolean {
  if (!process) return true;
  if (standard === "ISO 9606-2") return !RT_BLOCKED_PROCESSES_9606_2.has(process);
  return !RT_BLOCKED_PROCESSES_9606_1.has(process);
}

export function requiredNdtTests(oq: Pick<
  OperatorQualification,
  | "qualification_test_method"
  | "method1_standard"
  | "welding_type"
  | "product_type"
  | "joint_type"
  | "process"
>): NdtTestSpec[] {
  const method = oq.qualification_test_method;
  if (!method) return [];

  if (method === "Method_2") {
    return [
      { method: "VT", label: "Visual testing (VT)" },
      { method: "MT/PT", label: "MT / PT" },
      { method: "Macro", label: "Macro" },
    ];
  }

  if (method === "Method_3") {
    return [
      { method: "VT", label: "Visual testing (VT)" },
      { method: "MT/PT", label: "MT / PT" },
      { method: "Bend or Macro", label: "Bend testing or Macro" },
    ];
  }

  if (method === "Method_4") {
    return [
      { method: "VT", label: "Visual testing (VT)" },
      { method: "Macro", label: "Macro" },
      { method: "MT/PT", label: "MT / PT" },
    ];
  }

  // Method 1
  const product = oq.product_type;
  const joint = oq.joint_type;
  const tests: NdtTestSpec[] = [{ method: "VT", label: "Visual testing (VT)" }];

  if (isPlate(product) && isBw(joint)) {
    if (rtAllowed(oq.method1_standard, oq.process)) {
      tests.push({ method: "RT/UT/Bend", label: "RT / UT / Bend" });
    } else {
      tests.push({ method: "UT/Bend", label: "UT / Bend (RT not permitted)" });
    }
  } else if (isPlate(product) && isFw(joint)) {
    tests.push({ method: "Fracture/Macro", label: "Fracture / Macro" });
  } else if (isPipe(product) && isBw(joint)) {
    if (rtAllowed(oq.method1_standard, oq.process)) {
      tests.push({
        method: "RT/UT/Bend/Fracture/Notch Tensile",
        label: "RT / UT / Bend / Fracture / Notch Tensile",
      });
    } else {
      tests.push({
        method: "UT/Bend/Fracture/Notch Tensile",
        label: "UT / Bend / Fracture / Notch Tensile (RT not permitted)",
      });
    }
  } else if (isPipe(product) && isFw(joint)) {
    tests.push({ method: "Macro", label: "Macro" });
  } else {
    tests.push({ method: "Macro", label: "Macro" });
  }

  return tests;
}

export function ndtResultsPass(results: TestResult[]): boolean {
  return results.every((r) => r === "Pass" || r === "NA");
}

export function showMechanizedFields(mode: OperatorWeldingMode | null): boolean {
  return mode === "Mechanized";
}

export function showAutomaticFields(mode: OperatorWeldingMode | null): boolean {
  return mode === "Automatic";
}
