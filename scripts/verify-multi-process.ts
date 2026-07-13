/**
 * Multi-process qualification (ISO 9606-1) — designation + certificate rows.
 * Usage: npx tsx scripts/verify-multi-process.ts
 */
import assert from "node:assert/strict";
import { buildCertRows, buildDesignation } from "../src/lib/iso9606/certificate-model";
import {
  formatPerProcessDepositedRange,
  getProcessSlices,
  processDisplayText,
} from "../src/lib/iso9606/certificate-ranges";
import type { QualificationRecord, RangeOfApproval } from "../src/types/db";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

function baseWpq(overrides: Partial<QualificationRecord> = {}): QualificationRecord {
  return {
    id: "wpq-1",
    org_id: "org",
    welder_id: "w1",
    report_id: null,
    standard: "ISO_9606_1",
    process: "111",
    joint_type: "BW",
    joint_type_extended: null,
    position: "PH",
    product: "Pipe",
    branch_connection: null,
    base_material_group: "1.1",
    material_specification: "EN 10025",
    material_grade: "S355",
    material2_specification: "EN 10025",
    material2_grade: "S355",
    material2_group: "1.1",
    dimensions: null,
    dimension_thickness_mm: null,
    dimension_width_mm: null,
    dimension_length_mm: null,
    dimension2_thickness_mm: null,
    dimension2_width_mm: null,
    dimension2_length_mm: null,
    dimension2_pipe_od_mm: null,
    dimensions2: null,
    testing_standard: "EN ISO 9606-1:2017",
    filler_group: "FM1",
    filler_designation: "E 42 5 B 42 H5",
    filler_type: "Covered electrode (C)",
    shielding_gas: "N/A",
    current_polarity: "DCEP",
    test_thickness_mm: null,
    deposited_thickness_mm: 8,
    pipe_od_mm: 88.9,
    layer_type: "Multi-layer (ml)",
    transfer_mode: "N/A",
    weld_details: "ss nb",
    process_2: "141",
    process2_filler_group: "FM1",
    process2_filler_designation: "W 42 4 3Si1",
    process2_filler_type: "Solid wire/rod (S)",
    process2_shielding_gas: "ISO 14175 - I1",
    process2_current_polarity: "DCEP",
    process2_transfer_mode: "N/A",
    process2_weld_details: "ss mb",
    process2_layer_type: "Multi-layer (ml)",
    process2_deposited_thickness_mm: 3,
    job_knowledge: "Not tested",
    supplementary_fillet: true,
    supplementary_fillet_position: "PF",
    supplementary_fillet_thickness_mm: 12,
    supplementary_fillet_process: "111",
    wps_reference: "WPS-070",
    examiner_ref: "REF",
    examiner_name: "Examiner",
    date_of_welding: "2024-05-30",
    revalidation_method: "9.3b",
    wpq_status: "Approved",
    cloned_from: null,
    is_legacy: false,
    certificate_issued_date: "2025-01-27",
    certificate_pdf_path: null,
    signed_certificate_pdf_path: null,
    legacy_document_paths: [],
    continuity_last_verified: null,
    expiry_date: "2026-05-29",
    created_at: "",
    ...overrides,
  };
}

const range: RangeOfApproval = {
  id: "r1",
  wpq_id: "wpq-1",
  thickness_min_mm: 3,
  thickness_max_mm: 16,
  thickness_unlimited: false,
  pipe_od_min_mm: 44.45,
  pipe_od_max_mm: null,
  pipe_od_unlimited: true,
  approved_positions: ["PA", "PE", "PF"],
  approved_material_groups: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  approved_joint_types: ["BW", "FW"],
  summary: "",
  created_at: "",
};

console.log("Multi-process qualification (designation + certificate)\n");

test("process display uses plus separator", () => {
  assert.equal(processDisplayText(baseWpq()), "111+141");
});

test("buildDesignation returns two lines for multi-process + supplementary fillet", () => {
  const lines = buildDesignation(baseWpq(), range);
  assert.equal(lines.length, 2);
  assert.match(lines[0], /111\/141/);
  assert.match(lines[0], /s8\/3/);
  assert.match(lines[0], /C\/S/);
  assert.match(lines[0], /ssnb\/ssmb/);
  assert.doesNotMatch(lines[0], /\bml\b/);
  assert.doesNotMatch(lines[0], /\bsl\b/);
  assert.match(lines[1], /111/);
  assert.match(lines[1], /FW/);
  assert.match(lines[1], /t12/);
  assert.match(lines[1], /\bml\b/);
});

test("buildCertRows layer range includes sl & ml when supplementary fillet", () => {
  const rows = buildCertRows(baseWpq(), range);
  const layerRow = rows.find((r) => r.label === "Multi-layer / single layer");
  assert.ok(layerRow);
  assert.match(layerRow!.range, /sl & ml/);
  assert.match(layerRow!.range, /111/);
  assert.match(layerRow!.range, /141/);
});

test("135+136 multi-process BW designation matches client format", () => {
  const wpq = baseWpq({
    process: "135",
    process_2: "136",
    position: "PF",
    position_2: "PF",
    product: "Plate",
    deposited_thickness_mm: 12,
    process2_deposited_thickness_mm: 12,
    filler_type: "Solid wire/rod (S)",
    process2_filler_type: "Flux-cored (P)",
    weld_details: "ss nb",
    process2_weld_details: "ss mb",
    layer_type: "Single layer (sl)",
    process2_layer_type: "Single layer (sl)",
    supplementary_fillet: true,
    supplementary_fillet_process: "135",
    supplementary_fillet_position: "PF",
    supplementary_fillet_thickness_mm: 12,
    supplementary_fillet_2: true,
    supplementary_fillet_2_position: "PF",
    supplementary_fillet_2_thickness_mm: 12,
  });
  const line = buildDesignation(wpq, range)[0]!;
  assert.match(
    line,
    /ISO 9606-1 135\/136 P BW FM1 S\/P s12\/12 PF & PF ssnb\/ssmb/,
  );
  assert.doesNotMatch(line, /\bsl\b/);
});

test("buildCertRows shows per-process deposited thickness", () => {
  const rows = buildCertRows(baseWpq(), range);
  const deposited = rows.find((r) => r.label === "Deposited thickness (mm)");
  assert.ok(deposited);
  assert.match(deposited!.test, /\(BW\) 8\(111\) & 3\(141\)/);
  assert.match(deposited!.range, /111: 3 – 16 mm/);
  assert.match(deposited!.range, /141: 3 – 6 mm/);
});

test("getProcessSlices returns two entries", () => {
  assert.equal(getProcessSlices(baseWpq()).length, 2);
});

test("formatPerProcessDepositedRange matches Table 6 per process", () => {
  const text = formatPerProcessDepositedRange(getProcessSlices(baseWpq()));
  assert.match(text, /111: 3 – 16 mm/);
  assert.match(text, /141: 3 – 6 mm/);
});

test("formatPerProcessDepositedRange lists each process when ranges match", () => {
  const wpq = baseWpq({
    process: "135",
    process_2: "136",
    deposited_thickness_mm: 12,
    process2_deposited_thickness_mm: 12,
    layer_type: "Single layer (sl)",
    process2_layer_type: "Single layer (sl)",
  });
  const text = formatPerProcessDepositedRange(getProcessSlices(wpq));
  assert.equal(text, "135: >= 3 mm; 136: >= 3 mm");
});

test("single-process designation stays one line", () => {
  const wpq = baseWpq({
    process_2: null,
    process2_deposited_thickness_mm: null,
    supplementary_fillet: false,
    supplementary_fillet_process: null,
  });
  const lines = buildDesignation(wpq, range);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^ISO 9606-1 111/);
});

test("designation uses test position code, not expanded range positions", () => {
  const wpq = baseWpq({
    process: "141",
    process_2: null,
    position: "H-L045",
    deposited_thickness_mm: 11.99,
    supplementary_fillet: false,
    supplementary_fillet_process: null,
  });
  const hl045Range: RangeOfApproval = {
    ...range,
    approved_positions: ["PA", "PC", "PE", "PF"],
  };
  const line = buildDesignation(wpq, hl045Range)[0]!;
  assert.match(line, /H-L045/);
  assert.doesNotMatch(line, /PA&PC&PE&PF/);
});

console.log("\nAll multi-process tests passed.\n");
