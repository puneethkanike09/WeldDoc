// EN ISO 9606-1:2017 reference value sets used in dropdowns and the range engine.

export const TESTING_STANDARDS = [
  { code: "ISO 9606-1:2012", label: "ISO 9606-1:2012" },
  { code: "EN ISO 9606-1:2017", label: "EN ISO 9606-1:2017" },
  { code: "DIN EN ISO 9606-1:2017", label: "DIN EN ISO 9606-1:2017" },
] as const;

/** Annex A — types of test rows on the individual certificate. */
export const ANNEX_A_TEST_TYPES = [
  { label: "Visual testing", methods: ["Visual (Root)", "Visual (Cap)"] },
  { label: "Radiographic testing", methods: ["RT/UT"] },
  { label: "Ultrasonic testing", methods: ["RT/UT"] },
  { label: "PT — After back grind", methods: ["PT"] },
  { label: "Fracture test", methods: ["Fracture Test"] },
  { label: "Bend test", methods: ["Bend test"] },
  { label: "Notch tensile test", methods: ["Notch tensile test"] },
  { label: "Macroscopic examination", methods: ["Macroscopic examination"] },
] as const;

export const WELDING_PROCESSES = [
  { code: "111", name: "MMA / SMAW (manual metal arc)" },
  { code: "114", name: "Self-shielded tubular-cored arc" },
  { code: "121", name: "Submerged arc (single wire)" },
  { code: "125", name: "Submerged arc (tubular wire)" },
  { code: "131", name: "MIG (metal inert gas)" },
  { code: "135", name: "MAG / GMAW (metal active gas)" },
  { code: "136", name: "FCAW (flux-cored, active gas)" },
  { code: "138", name: "Metal-cored, active gas" },
  { code: "141", name: "TIG / GTAW (tungsten inert gas)" },
  { code: "15", name: "Plasma arc welding" },
  { code: "311", name: "Oxy-acetylene welding" },
] as const;

export const TRANSFER_MODES = ["Dip", "Globular", "Spray", "Pulse"] as const;

export const PRODUCT_TYPES = ["Plate", "Pipe", "Branch", "Other"] as const;

export const JOINT_TYPES = [
  { code: "BW", label: "Butt weld (BW)" },
  { code: "FW", label: "Fillet weld (FW)" },
] as const;

// Butt weld positions (Table 9 / ISO 6947) + fillet positions (Table 10).
export const BW_POSITIONS = [
  "PA",
  "PC",
  "PE",
  "PF",
  "PG",
  "PH",
  "PJ",
  "H-L045",
  "J-L045",
] as const;

export const FW_POSITIONS = [
  "PA",
  "PB",
  "PC",
  "PD",
  "PE",
  "PF",
  "PG",
  "PH",
  "PJ",
] as const;

export const POSITION_LABELS: Record<string, string> = {
  PA: "PA — flat",
  PB: "PB — horizontal-vertical (fillet)",
  PC: "PC — horizontal",
  PD: "PD — horizontal-overhead (fillet)",
  PE: "PE — overhead",
  PF: "PF — vertical up",
  PG: "PG — vertical down",
  PH: "PH — pipe fixed, vertical up",
  PJ: "PJ — pipe fixed, vertical down",
  "H-L045": "H-L045 — pipe inclined fixed (up)",
  "J-L045": "J-L045 — pipe inclined fixed (down)",
};

// Parent material groups per CR ISO 15608 (subset relevant to ISO 9606-1 steel).
export const MATERIAL_GROUPS = [
  { code: "1", label: "Group 1 — unalloyed / low-alloy steel" },
  { code: "2", label: "Group 2 — thermomechanical / fine-grain steel" },
  { code: "3", label: "Group 3 — quenched & tempered steel" },
  { code: "4", label: "Group 4 — low Cr-Mo creep-resisting" },
  { code: "5", label: "Group 5 — Cr-Mo creep-resisting" },
  { code: "6", label: "Group 6 — high Cr-Mo(-V)" },
  { code: "7", label: "Group 7 — ferritic/martensitic stainless (≥10.5% Cr)" },
  { code: "8", label: "Group 8 — austenitic stainless" },
  { code: "9", label: "Group 9 — nickel-alloyed steel" },
  { code: "10", label: "Group 10 — duplex stainless" },
  { code: "11", label: "Group 11 — high-C steel" },
] as const;

// Filler material groups (ISO 9606-1 Table 2 — FM1..FM6).
export const FILLER_GROUPS = [
  { code: "FM1", label: "FM1 — non-alloy / fine-grain steels" },
  { code: "FM2", label: "FM2 — high-strength steels" },
  { code: "FM3", label: "FM3 — creep-resisting (Cr ≤ 3.75%)" },
  { code: "FM4", label: "FM4 — creep-resisting (3.75% < Cr ≤ 12%)" },
  { code: "FM5", label: "FM5 — stainless / heat-resisting" },
  { code: "FM6", label: "FM6 — nickel and nickel alloys" },
] as const;

export const FILLER_TYPES = [
  "No filler (nm)",
  "Solid wire/rod (S)",
  "Metal-cored (M)",
  "Flux-cored (B — basic)",
  "Flux-cored (R — rutile)",
  "Flux-cored (P — rutile, fast-freezing)",
  "Flux-cored (V/W/Y/Z)",
  "Covered electrode (A — acid)",
  "Covered electrode (C — cellulosic)",
  "Covered electrode (B — basic)",
  "Covered electrode (R/RR — rutile)",
] as const;

export const CURRENT_POLARITY = ["AC", "DCEP", "DCEN", "Pulsed"] as const;

export const LAYER_TYPES = ["Single layer (sl)", "Multi-layer (ml)"] as const;

// Weld detail codes (EN ISO 9606-1 designation): ss=single side, bs=both sides,
// nb=no backing, mb=with backing, gb=gas backing, fb=flux backing, gg=gouging.
export const WELD_DETAILS = [
  { code: "ss nb", label: "ss nb — single side, no backing" },
  { code: "ss mb", label: "ss mb — single side, with backing" },
  { code: "ss gb", label: "ss gb — single side, gas backing" },
  { code: "ss fb", label: "ss fb — single side, flux backing" },
  { code: "bs", label: "bs — both sides" },
  { code: "bs gg", label: "bs gg — both sides, gouged" },
] as const;

export const TRANSFER_MODE_OPTIONS = [
  "Spray",
  "Globular",
  "Dip / short-circuit",
  "Pulsed",
  "N/A",
] as const;

export const ID_METHODS = ["Aadhar", "Passport", "ID Card", "Other"] as const;

export const REVALIDATION_METHODS = [
  { code: "9.3a", label: "9.3a — prolongation by employer (every 6 months)" },
  { code: "9.3b", label: "9.3b — prolongation by examiner (every 2 years)" },
  {
    code: "9.3c",
    label: "9.3c — ISO 3834 quality system (6-monthly, unlimited)",
  },
] as const;

export const BW_TESTS = [
  "Visual (Root)",
  "Visual (Cap)",
  "RT/UT",
] as const;

export const FW_TESTS = ["Visual (Root)", "Fracture Test"] as const;

export const OPTIONAL_TESTS = [
  "PT",
  "Bend test",
  "Notch tensile test",
  "Macroscopic examination",
] as const;

export function processLabel(code: string): string {
  const p = WELDING_PROCESSES.find((x) => x.code === code);
  return p ? `${p.name.split(" ")[0]} (${p.code})` : code;
}

export function requiredTestsFor(joint: "BW" | "FW"): readonly string[] {
  return joint === "BW" ? BW_TESTS : FW_TESTS;
}
