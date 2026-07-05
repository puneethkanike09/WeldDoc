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

test("welder-only row validates (name + W# only)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw() }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.welderCount, 1);
  assert.equal(r.summary.newWelderCount, 1);
  assert.equal(r.summary.qualificationCount, 0);
  assert.equal(r.rows[0].qualification, null);
});

test("requires plant_welder_id (W# No)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "" }) }],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "plant_welder_id"));
});

test("requires full_name", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ full_name: "" }) }],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "full_name"));
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

test("attaches to existing plant ID in org (no error)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw() } }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.existingWelderCount, 1);
  assert.equal(r.summary.newWelderCount, 0);
});

test("matches existing plant ID regardless of format (9001 == W#9001)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "9001" }) }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.existingWelderCount, 1);
});

test("multiple qualification rows for the same W# = one welder", () => {
  const r = validateImportRows(
    [
      { excelRow: 2, raw: { ...baseWelderRaw({ plant_welder_id: "W#50" }), ...qualRaw() } },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw({ plant_welder_id: "W#50" }),
          ...qualRaw({ process: "141", position: "PA" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.welderCount, 1);
  assert.equal(r.summary.qualificationCount, 2);
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

test("accepts process label with embedded code (MAG (135))", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ process: "MAG (135)" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "135");
  assert.equal(r.rows[0].raw.process, "135");
});

test("accepts AWS abbreviation for process (SMAW -> 111)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ process: "SMAW" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "111");
});

test("accepts joint synonyms and lowercase (Butt -> BW)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ joint_type: "Butt", position: "pf" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.jointType, "BW");
  assert.equal(r.rows[0].qualification?.position, "PF");
});

test("accepts material group label (Group 1 — ...)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ base_material_group: "Group 1 — unalloyed" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.baseMaterialGroup, "1");
});

test("accepts lowercase welder_status (active -> Active)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ welder_status: "active" }) }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].welder.welderStatus, "Active");
});

test("normalizes revalidation method (6.3b/9.3B/b -> 9.3b)", () => {
  for (const input of ["6.3b", "9.3B", "b", "3B"]) {
    const r = validateImportRows(
      [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ revalidation_method: input }) } }],
      new Set(),
    );
    assert.equal(r.ok, true, `${input}: ${JSON.stringify(r.errors)}`);
    assert.equal(r.rows[0].qualification?.revalidationMethod, "9.3b");
  }
});

test("accepts common date formats (15/06/2024 -> 2024-06-15)", () => {
  const cases: Array<[string, string]> = [
    ["15/06/2024", "2024-06-15"],
    ["15-06-2024", "2024-06-15"],
    ["15.06.2024", "2024-06-15"],
    ["10 May 2023", "2023-05-10"],
    ["2024-06-15", "2024-06-15"],
  ];
  for (const [input, expected] of cases) {
    const r = validateImportRows(
      [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ date_of_welding: input }) } }],
      new Set(),
    );
    assert.equal(r.ok, true, `${input}: ${JSON.stringify(r.errors)}`);
    assert.equal(r.rows[0].qualification?.dateOfWelding, expected);
  }
});

test("strips units from numeric cells (12 mm -> 12)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ test_thickness_mm: "12 mm" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.testThicknessMm, 12);
});

test("stray NA in optional column does not force a qualification", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ result_vt: "NA" }) }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification, null);
});

test("preserves raw values for invalid cells (data does not disappear)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw({ position: "ZZ" }) } }],
    new Set(),
  );
  assert.equal(r.ok, false);
  // Even though the row has an invalid position, the other qual values remain
  // visible in the preview grid via row.raw.
  assert.equal(r.rows[0].raw.process, "135");
  assert.equal(r.rows[0].raw.position, "ZZ");
  assert.equal(r.rows[0].raw.date_of_welding, "2023-01-15");
});

console.log("\nAll bulk import validation tests passed.");
