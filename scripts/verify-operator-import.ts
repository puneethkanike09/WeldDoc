import assert from "node:assert/strict";
import { validateOperatorParsedImport } from "../src/lib/operators/bulk-import/validate";
import { parseOperatorImportWorkbook } from "../src/lib/operators/bulk-import/parse";
import { buildOperatorImportTemplateBuffer } from "../src/lib/operators/bulk-import/template";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

function baseOperatorRaw(overrides: Record<string, string> = {}) {
  return {
    plant_operator_id: "O#9001",
    full_name: "Test Operator",
    ...overrides,
  };
}

function qualRaw(overrides: Record<string, string> = {}) {
  return {
    welding_type: "Fusion",
    welding_mode: "Mechanized",
    process: "135",
    product_type: "Plate",
    joint_type: "BW",
    qualification_test_method: "Method_1",
    method1_standard: "ISO 9606-1",
    date_of_welding: "2024-06-15",
    revalidation_method: "6.3b",
    result_vt: "Pass",
    ...overrides,
  };
}

function validate(raw: Record<string, string>, existing: string[] = []) {
  return validateOperatorParsedImport(
    [{ excelRow: 2, raw }],
    new Set(existing),
  );
}

console.log("Bulk operator import validation\n");

test("template parses with lenient headers", () => {
  const r = parseOperatorImportWorkbook(buildOperatorImportTemplateBuffer());
  assert.equal(r.fileError, undefined, r.fileError);
  assert.ok(r.rows.length >= 2);
});

test("operator-only row validates (name + O# only)", () => {
  const r = validate(baseOperatorRaw());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification, null);
  assert.equal(r.summary.newOperatorCount, 1);
});

test("requires plant_operator_id (O# No)", () => {
  const r = validate(baseOperatorRaw({ plant_operator_id: "" }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "plant_operator_id"));
});

test("requires full_name", () => {
  const r = validate(baseOperatorRaw({ full_name: "" }));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "full_name"));
});

test("operator + qualification validates", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw() });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.qualificationCount, 1);
});

test("accepts process label with embedded code (MAG (135))", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ process: "MAG (135)" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "135");
});

test("accepts British spelling welding_mode (Mechanised)", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ welding_mode: "Mechanised" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.weldingMode, "Mechanized");
});

test("accepts lowercase welding_type (fusion -> Fusion)", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ welding_type: "fusion" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.weldingType, "Fusion");
});

test("accepts 'Method 1' text for qualification_test_method", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ qualification_test_method: "Method 1" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.qualificationTestMethod, "Method_1");
});

test("maps welder 9.3b to operator 6.3b", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ revalidation_method: "9.3b" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.revalidationMethod, "6.3b");
});

test("accepts common date formats (15/06/2024 -> 2024-06-15)", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ date_of_welding: "15/06/2024" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.dateOfWelding, "2024-06-15");
});

test("accepts joint synonym (Butt -> BW) for fusion", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ joint_type: "Butt" }) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.jointType, "BW");
});

test("preserves raw values for invalid cells (data does not disappear)", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw({ product_type: "ZZZ" }) });
  assert.equal(r.ok, false);
  assert.equal(r.rows[0].raw.process, "135");
  assert.equal(r.rows[0].raw.product_type, "ZZZ");
  assert.equal(r.rows[0].raw.date_of_welding, "2024-06-15");
});

test("attaches to existing plant ID in org (no error)", () => {
  const r = validate({ ...baseOperatorRaw(), ...qualRaw() }, ["O#9001"]);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.existingOperatorCount, 1);
  assert.equal(r.summary.newOperatorCount, 0);
});

console.log("\nAll operator import validation tests passed.");
