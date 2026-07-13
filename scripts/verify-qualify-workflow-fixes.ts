/**
 * Regression checks for qualification workflow fixes (Jul 2026).
 * Usage: npx tsx scripts/verify-qualify-workflow-fixes.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildDesignation } from "../src/lib/iso9606/certificate-model";
import {
  ndtTestsComplete,
  wpqReadyForCertificate,
} from "../src/lib/iso9606/qualification-fields";
import { buildOperatorIdCardRows } from "../src/lib/iso14732/id-card-model";
import { operatorNdtReady } from "../src/lib/iso14732/qualification-fields";
import {
  relativeDueCompact,
  relativeDueInLabel,
} from "../src/lib/qualify/expiry-display";
import type {
  NdtDtRecord,
  OperatorQualification,
  QualificationRecord,
  RangeOfApproval,
} from "../src/types/db";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

const passNdt: Pick<NdtDtRecord, "test_method" | "result">[] = [
  { test_method: "Visual Testing (VT)", result: "Pass" },
  { test_method: "Radiographic Testing (RT)", result: "Pass" },
];

const failNdt: Pick<NdtDtRecord, "test_method" | "result">[] = [
  { test_method: "Visual Testing (VT)", result: "Fail" },
];

console.log("Qualification workflow regression checks\n");

test("relativeDueInLabel: today / 1 day / plural", () => {
  assert.equal(relativeDueInLabel(0), "today");
  assert.equal(relativeDueInLabel(1), "in 1 day");
  assert.equal(relativeDueInLabel(14), "in 14 days");
});

test("relativeDueCompact: today / Nd", () => {
  assert.equal(relativeDueCompact(0), "today");
  assert.equal(relativeDueCompact(1), "1d");
  assert.equal(relativeDueCompact(14), "14d");
});

test("wpqReadyForCertificate: Pending_NDT + all Pass", () => {
  assert.equal(
    wpqReadyForCertificate(
      { wpq_status: "Pending_NDT", joint_type: "BW" },
      passNdt,
    ),
    true,
  );
});

test("wpqReadyForCertificate: Approved + all Pass (re-issue after edit)", () => {
  assert.equal(
    wpqReadyForCertificate(
      { wpq_status: "Approved", joint_type: "BW" },
      passNdt,
    ),
    true,
  );
});

test("wpqReadyForCertificate: Approved + Fail blocks issue", () => {
  assert.equal(
    wpqReadyForCertificate(
      { wpq_status: "Approved", joint_type: "BW" },
      failNdt,
    ),
    false,
  );
});

test("wpqReadyForCertificate: Failed status blocks issue", () => {
  assert.equal(
    wpqReadyForCertificate({ wpq_status: "Failed", joint_type: "BW" }, passNdt),
    false,
  );
});

test("wpqReadyForCertificate: Draft blocks issue even with Pass NDT", () => {
  assert.equal(
    wpqReadyForCertificate({ wpq_status: "Draft", joint_type: "BW" }, passNdt),
    false,
  );
});

test("ndtTestsComplete requires at least one Pass row", () => {
  assert.equal(ndtTestsComplete("BW", []), false);
  assert.equal(ndtTestsComplete("BW", passNdt), true);
  assert.equal(ndtTestsComplete("BW", failNdt), false);
});

test("designation uses test position H-L045, not PA/PC/PE/PF range", () => {
  const wpq = {
    process: "141",
    joint_type: "BW",
    product: "Pipe",
    position: "H-L045",
    deposited_thickness_mm: 11.99,
    filler_group: "FM2",
    filler_type: "Solid wire/rod (S)",
    weld_details: "ss nb",
    layer_type: "Multi-layer (ml)",
    supplementary_fillet: false,
    supplementary_fillet_2: false,
    process_2: null,
  } as QualificationRecord;

  const range = {
    approved_positions: ["PA", "PC", "PE", "PF"],
  } as RangeOfApproval;

  const line = buildDesignation(wpq, range)[0]!;
  assert.match(line, /H-L045/);
  assert.doesNotMatch(line, /PA&PC&PE&PF/);
});

test("operator ID card rows use ISO 14732 columns (not welder grid)", () => {
  const oq = {
    id: "oq-1",
    org_id: "org",
    operator_id: "op-1",
    process: "121",
    welding_mode: "Mechanized",
    joint_type: "BW",
    welding_type: "Fusion",
    product_type: "Pipe",
    revalidation_method: "6.3b",
    date_of_welding: "2026-07-12",
    certificate_issued_date: "2026-07-12",
    expiry_date: "2032-07-11",
    oq_status: "Approved",
    is_active: true,
  } as OperatorQualification;

  const rows = buildOperatorIdCardRows([oq]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.process, "121");
  assert.equal(rows[0]!.weldingEquipmentType, "Mechanized");
  assert.equal(rows[0]!.jointType, "BW");
  assert.notEqual(rows[0]!.weldingEquipmentType, "Plate");
  assert.notEqual(rows[0]!.jointType, "6.3b");
});

test("operatorNdtReady works for Approved qualification", () => {
  const oq = {
    welding_type: "Fusion",
    welding_mode: "Mechanized",
    product_type: "Pipe",
    joint_type: "BW",
    qualification_test_method: "Method 1",
    oq_status: "Approved",
  } as OperatorQualification;

  const ndt = [
    { test_method: "VT", result: "Pass" as const },
    { test_method: "RT", result: "Pass" as const },
  ];
  assert.equal(operatorNdtReady(oq, ndt), true);
});

const parallelNullSlots = [
  "src/app/(app)/welders/[id]/@qualifications/qualify/page.tsx",
  "src/app/(app)/operators/[id]/@qualifications/qualify/page.tsx",
];

for (const rel of parallelNullSlots) {
  test(`parallel route slot exists and returns null: ${rel}`, () => {
    const path = join(process.cwd(), rel);
    assert.ok(existsSync(path), `missing ${rel}`);
    const src = readFileSync(path, "utf8");
    assert.match(src, /return null/);
  });
}

test("saveNdt redirects to step 4 (welder)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/(app)/welders/[id]/qualify/actions.ts"),
    "utf8",
  );
  assert.match(src, /step=4&ndt=\$\{ndtFlash\}/);
  assert.doesNotMatch(src, /anyFail \? 3 : 4/);
});

test("saveNdt redirects to step 4 (operator)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/app/(app)/operators/[id]/qualify/actions.ts"),
    "utf8",
  );
  assert.match(src, /step=4&ndt=\$\{ndtFlash\}/);
  assert.doesNotMatch(src, /anyFail \? 3 : 4/);
});

test("operator ID card page hides print button", () => {
  const src = readFileSync(
    join(
      process.cwd(),
      "src/app/(id-card)/operators/[id]/id-card/page.tsx",
    ),
    "utf8",
  );
  assert.match(src, /showPrint=\{false\}/);
});

console.log("\nAll qualification workflow regression checks passed.\n");
