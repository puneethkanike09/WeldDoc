import assert from "node:assert/strict";
import { validateImportRows } from "../src/lib/welders/bulk-import/validate";

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

test("allows blank plant ID for auto-assign on import", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "" }) }],
    new Set(),
  );
  assert.equal(r.ok, true);
  assert.equal(r.rows[0].welder.plantWelderId, "");
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
