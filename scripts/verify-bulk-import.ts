import assert from "node:assert/strict";
import { validateImportRows } from "../src/lib/welders/bulk-import/validate";
import {
  TEMPLATE_EXAMPLE_ROW_COUNT,
  verifyBuiltImportTemplate,
} from "../src/lib/welders/bulk-import/template";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  OK ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

function baseWelderRaw(overrides: Record<string, string> = {}) {
  return {
    plant_welder_id: "W#9001",
    full_name: "Test Welder",
    date_of_birth: "1990-01-01",
    place_of_birth: "City, State, Country",
    id_method: "Passport",
    id_number: "P123",
    welder_status: "Active",
    ...overrides,
  };
}

function qualRaw(overrides: Record<string, string> = {}) {
  return {
    process: "135",
    joint_type: "BW",
    position: "PF",
    base_material_group: "1",
    filler_group: "FM1",
    test_thickness_mm: "12",
    product: "Plate",
    testing_standard: "EN ISO 9606-1:2017",
    date_of_welding: "2023-01-15",
    revalidation_method: "9.3b",
    result_vt: "Pass",
    result_rt_ut: "NA",
    result_fracture: "NA",
    ...overrides,
  };
}

console.log("Bulk welder import validation\n");

test("built template parses with all example rows", () => {
  const r = verifyBuiltImportTemplate();
  assert.equal(r.ok, true, r.fileError ?? `row count ${r.rowCount}`);
  assert.equal(r.rowCount, TEMPLATE_EXAMPLE_ROW_COUNT);
});

test("welder-only row validates", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw() }],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.summary.welderCount, 1);
  assert.equal(r.summary.qualificationCount, 0);
  assert.equal(r.rows[0].qualification, null);
});

test("welder + qualification validates and computes expiry", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.summary.qualificationCount, 1);
  assert.equal(r.rows[0].qualification?.expiryDate, "2025-01-15");
  assert.equal(r.rows[0].qualification?.wpqStatus, "Approved");
});

test("rejects existing plant ID in org", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw() }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, false);
  assert.match(r.errors[0].message, /already exists/);
});

test("normalizes plant ID formats for duplicate checks", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "9001" }) }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, false);
});

test("auto-assigns plant ID when blank", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "" }) }],
    new Set(),
    { welderSeq: 10 },
  );
  assert.equal(r.ok, true);
  assert.equal(r.rows[0].welder.plantWelderId, "W#11");
});

test("auto-assigns sequential IDs for multiple blank welders", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: baseWelderRaw({ plant_welder_id: "", id_number: "A1" }),
      },
      {
        excelRow: 3,
        raw: baseWelderRaw({
          plant_welder_id: "",
          full_name: "Second Welder",
          id_number: "A2",
        }),
      },
    ],
    new Set(["W#01"]),
    { welderSeq: 1 },
  );
  assert.equal(r.ok, true);
  assert.equal(r.summary.welderCount, 2);
  assert.equal(r.rows[0].welder.plantWelderId, "W#02");
  assert.equal(r.rows[1].welder.plantWelderId, "W#03");
});

test("same auto plant ID on multiple qualification rows", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw({ plant_welder_id: "", id_number: "MULTI-1" }),
          ...qualRaw(),
        },
      },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw({ plant_welder_id: "", id_number: "MULTI-1" }),
          ...qualRaw({ process: "141", position: "PA" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.summary.welderCount, 1);
  assert.equal(r.rows[0].welder.plantWelderId, r.rows[1].welder.plantWelderId);
  assert.match(r.rows[0].welder.plantWelderId, /^W#\d+$/);
});

test("rejects conflicting welder details for same plant ID", () => {
  const r = validateImportRows(
    [
      { excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw() } },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw({ full_name: "Different Name" }),
          ...qualRaw({ process: "141" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.message.includes("conflict")));
});

test("allows multiple qualifications for same welder", () => {
  const r = validateImportRows(
    [
      { excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw() } },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({ process: "141", position: "PA" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.summary.welderCount, 1);
  assert.equal(r.summary.qualificationCount, 2);
});

test("rejects duplicate id_number within file", () => {
  const r = validateImportRows(
    [
      { excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "W#10", id_number: "DUP-1" }) },
      {
        excelRow: 3,
        raw: baseWelderRaw({
          plant_welder_id: "W#11",
          full_name: "Other Person",
          id_number: "DUP-1",
        }),
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "id_number"));
});

test("rejects id_number already in organisation", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ id_number: "EXIST-99" }) }],
    new Set(),
    { existingIdNumbers: ["exist-99"] },
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.message.includes("already registered")));
});

test("rejects partial qualification columns", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: baseWelderRaw({ process: "135" }),
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.message.includes("When importing qualifications")),
  );
});

test("invalid process code fails", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: { ...baseWelderRaw(), ...qualRaw({ process: "999" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
});

test("NDT fail sets wpq status Failed", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({ result_vt: "Fail" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.rows[0].qualification?.wpqStatus, "Failed");
});

test("expiry before qual date fails", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            date_of_welding: "2024-06-01",
            expiry_date: "2020-01-01",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
});

console.log("\nAll bulk import validation tests passed.");
