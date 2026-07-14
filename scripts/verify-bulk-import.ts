import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { IMPORT_SHEET_NAME } from "../src/lib/welders/bulk-import/columns";
import {
  buildImportTemplateBuffer,
  TEMPLATE_EXAMPLE_ROW_COUNT,
  verifyBuiltImportTemplate,
} from "../src/lib/welders/bulk-import/template";
import { matchPhotosToWelders } from "../src/lib/welders/bulk-import/match-import-photos";
import { validateImportRows } from "../src/lib/welders/bulk-import/validate";
import {
  collectValidationRecordsForImport,
  parseDateHistory,
} from "../src/lib/welders/bulk-import/parse-history";
import { computeClientDateSchedule } from "../src/lib/welders/bulk-import/client-date-guide";
import { coerceIdNumberString } from "../src/lib/welders/bulk-import/id-number";
import { parseImportWorkbook } from "../src/lib/welders/bulk-import/parse";

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
    date_of_welding: "2025-01-15",
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

test("template has only Import sheet", () => {
  const buffer = buildImportTemplateBuffer();
  const wb = XLSX.read(buffer, { type: "buffer" });
  assert.deepEqual(wb.SheetNames, [IMPORT_SHEET_NAME]);
});

test("template includes expiry_date, continuity_last_verified, photo_filename in header", () => {
  const buffer = buildImportTemplateBuffer();
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[IMPORT_SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  const header = rows[0] as string[];
  assert.ok(header.includes("expiry_date"));
  assert.ok(header.includes("continuity_last_verified"));
  assert.ok(header.includes("continuity_history"));
  assert.ok(header.includes("revalidation_history"));
  assert.ok(header.includes("photo_filename"));
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

test("allows blank plant_welder_id (auto-assign in preview)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ plant_welder_id: "" }) }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].welder.plantWelderId, "");
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
  assert.equal(r.rows[0].qualification?.expiryDate, "2027-01-14");
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
  assert.equal(r.rows[0].raw.date_of_welding, "2025-01-15");
});

test("fill-forward copies welder fields on qualification rows", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#02",
          full_name: "Sanjay",
          date_of_birth: "1988-05-20",
          id_method: "Aadhar",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          plant_welder_id: "",
          full_name: "",
          process: "141",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[1].welder.fullName, "Sanjay");
  assert.equal(r.rows[1].welder.plantWelderId, "W#02");
  assert.equal(r.rows[1].welder.dateOfBirth, "1988-05-20");
  assert.equal(r.rows[1].welder.idMethod, "Aadhar");
});

test("does not fill-forward photo_filename to the next welder row", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#02",
          full_name: "Sanjay Yadav",
          photo_filename: "W#02.jpg",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          plant_welder_id: "W#03",
          full_name: "Sanjay Yadav",
          process: "141",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].welder.photoFilename, "W#02.jpg");
  assert.equal(r.rows[0].raw.photo_filename, "W#02.jpg");
  assert.equal(r.rows[1].welder.photoFilename, null);
  assert.equal(r.rows[1].raw.photo_filename, "");

  const { matches } = matchPhotosToWelders(r.rows, [
    { filename: "W#02.jpg", bytes: Buffer.from("a"), mime: "image/jpeg" },
    { filename: "W#03.jpg", bytes: Buffer.from("b"), mime: "image/jpeg" },
  ]);
  assert.equal(matches.get("W#02")?.filename, "W#02.jpg");
  assert.equal(matches.get("W#03")?.filename, "W#03.jpg");
});

test("new welder row with W# does not inherit blank fields from row above", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#02",
          full_name: "Sanjay Yadav",
          date_of_birth: "1988-05-20",
          id_method: "Aadhar",
          id_number: "123456789012",
          photo_filename: "W#02.jpg",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          plant_welder_id: "W#03",
          full_name: "Sanjay Yadav",
          process: "141",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 4,
        raw: {
          plant_welder_id: "W#15",
          full_name: "Rajesh Kumar",
          process: "111",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-06-10",
          revalidation_method: "9.3a",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  // W#03 — blanks stay blank, not copied from W#02
  assert.equal(r.rows[1].welder.dateOfBirth, null);
  assert.equal(r.rows[1].welder.idMethod, null);
  assert.equal(r.rows[1].welder.idNumber, null);
  assert.equal(r.rows[1].raw.date_of_birth, "");
  assert.equal(r.rows[1].raw.id_method, "");
  assert.equal(r.rows[1].raw.id_number, "");
  // W#15 — same
  assert.equal(r.rows[2].welder.dateOfBirth, null);
  assert.equal(r.rows[2].raw.photo_filename, "");
});

test("qualification columns are never fill-forwarded between welders", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#02",
          full_name: "Sanjay",
          process: "136",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          plant_welder_id: "W#03",
          full_name: "Rajesh",
          process: "141",
          joint_type: "BW",
          position: "PA",
          base_material_group: "1",
          test_thickness_mm: "10",
          product: "Plate",
          date_of_welding: "2024-01-10",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "136");
  assert.equal(r.rows[1].qualification?.process, "141");
  assert.equal(r.rows[1].qualification?.position, "PA");
  assert.notEqual(r.rows[1].qualification?.process, "136");
});

test("template id_number parses as full digits from Excel number cell", () => {
  const buffer = buildImportTemplateBuffer();
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const { rows, fileError } = parseImportWorkbook(arrayBuffer);
  assert.equal(fileError, undefined);
  assert.equal(rows[0].raw.id_number, "123456789012");
  const v = validateImportRows(rows, new Set());
  assert.equal(v.rows[0].welder.idNumber, "123456789012");
});

test("coerces scientific notation id_number strings", () => {
  assert.equal(coerceIdNumberString("1.23456789012E+11"), "123456789012");
});

test("legacy expiry used as-is not recalculated from old test date", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#15",
          full_name: "Rajesh",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-06-10",
          expiry_date: "2026-03-01",
          continuity_last_verified: "2025-12-01",
          revalidation_method: "9.3a",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.expiryDate, "2026-03-01");
  assert.equal(r.rows[0].qualification?.continuityLastVerified, "2025-12-01");
  assert.notEqual(r.rows[0].qualification?.expiryDate, "2022-06-10");
  assert.equal(r.warnings.length, 0);
});

test("expired legacy cert gets Expired status", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#99",
          full_name: "Old Cert",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-01-01",
          expiry_date: "2020-01-01",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.wpqStatus, "Expired");
});

test("missing expiry_date emits estimate warning", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...qualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.continuityLastVerified, null);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].column, "expiry_date");
  assert.ok(r.warnings[0].message.includes("Expiry estimated"));
});

console.log("\nValidation history\n");

test("parses continuity_history semicolon-separated dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            continuity_history:
              "2020-01-15;2020-07-15;2021-01-15;2025-12-01",
            continuity_last_verified: "2025-12-01",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.rows[0].qualification?.continuityHistory, [
    "2020-01-15",
    "2020-07-15",
    "2021-01-15",
    "2025-12-01",
  ]);
});

test("parses comma-separated history dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            continuity_history: "2020-01-15, 2020-07-15",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.rows[0].qualification?.continuityHistory, [
    "2020-01-15",
    "2020-07-15",
  ]);
  assert.equal(
    r.rows[0].qualification?.continuityLastVerified,
    "2020-07-15",
  );
});

test("rejects invalid date in continuity_history", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({ continuity_history: "2020-01-15;not-a-date" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.column === "continuity_history"),
  );
});

test("dedupes continuity_history dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            continuity_history: "2020-01-15;2020-01-15;2021-01-15",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.rows[0].qualification?.continuityHistory, [
    "2020-01-15",
    "2021-01-15",
  ]);
});

test("warns when continuity_last_verified mismatches latest history date", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            continuity_history: "2020-01-15;2021-01-15",
            continuity_last_verified: "2025-12-01",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(
    r.warnings.some(
      (w) =>
        w.column === "continuity_last_verified" &&
        w.message.includes("differs from the latest date"),
    ),
  );
});

test("parses revalidation_history dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...qualRaw({
            revalidation_history: "2021-06-10;2023-06-10",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.rows[0].qualification?.revalidationHistory, [
    "2021-06-10",
    "2023-06-10",
  ]);
});

test("collectValidationRecordsForImport merges continuity snapshot and history", () => {
  const records = collectValidationRecordsForImport({
    continuityLastVerified: "2025-12-01",
    continuityHistory: ["2020-01-15", "2021-01-15", "2025-12-01"],
    revalidationHistory: ["2021-06-10", "2023-06-10"],
  });
  assert.equal(
    records.filter((r) => r.kind === "continuity").length,
    3,
  );
  assert.equal(
    records.filter((r) => r.kind === "revalidation").length,
    2,
  );
  assert.ok(
    records.some(
      (r) => r.kind === "continuity" && r.validatedOn === "2025-12-01",
    ),
  );
});

test("collectValidationRecordsForImport uses only last verified when no history", () => {
  const records = collectValidationRecordsForImport({
    continuityLastVerified: "2025-12-01",
    continuityHistory: [],
    revalidationHistory: [],
  });
  assert.deepEqual(records, [
    { validatedOn: "2025-12-01", kind: "continuity" },
  ]);
});

test("parseDateHistory sorts dates chronologically", () => {
  const errors: Array<{ excelRow: number; column?: string; message: string }> =
    [];
  const dates = parseDateHistory(
    "2021-01-15;2020-01-15",
    "continuity_history",
    2,
    errors,
  );
  assert.equal(errors.length, 0);
  assert.deepEqual(dates, ["2020-01-15", "2021-01-15"]);
});

test("legacy Rajesh example imports full validation history fields", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          plant_welder_id: "W#15",
          full_name: "Rajesh",
          process: "135",
          joint_type: "BW",
          position: "PF",
          base_material_group: "1",
          test_thickness_mm: "12",
          product: "Plate",
          date_of_welding: "2019-06-10",
          expiry_date: "2026-03-01",
          continuity_last_verified: "2025-12-01",
          continuity_history:
            "2019-12-01;2020-06-01;2021-06-01;2023-06-01;2025-12-01",
          revalidation_history: "2021-06-10;2023-06-10",
          revalidation_method: "9.3a",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.continuityHistory.length, 5);
  assert.equal(r.rows[0].qualification?.revalidationHistory.length, 2);
  const records = collectValidationRecordsForImport(r.rows[0].qualification!);
  assert.equal(records.length, 7);
});

console.log("\nClient date guide (plant Excel rules)\n");

test("client schedule matches plant sheet for Test Date 12-Mar-24", () => {
  const s = computeClientDateSchedule("2024-03-12");
  assert.equal(s.validation1, "2024-09-11"); // 11-Sep-24
  assert.equal(s.validation2, "2025-03-10"); // 10-Mar-25
  assert.equal(s.validation3, "2025-09-09"); // 09-Sep-25
  assert.equal(s.revalidation, "2026-03-12"); // 12-Mar-26
  assert.equal(s.validation4, "2026-09-11"); // 11-Sep-26
  assert.equal(s.validation5, "2027-03-10"); // 10-Mar-27
  assert.equal(s.validation6, "2027-09-09"); // 09-Sep-27
  assert.equal(s.expiry, "2028-03-12"); // 12-Mar-28
});

console.log("\nPhoto matching\n");

test("photo match by photo_filename column", () => {
  const { matches, results } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: "sanjay.jpg" } }],
    [{ filename: "sanjay.jpg", bytes: Buffer.from("x"), mime: "image/jpeg" }],
  );
  assert.equal(matches.size, 1);
  assert.equal(results[0].status, "ready");
});

test("photo match by plant_welder_id fallback W#02.png", () => {
  const { matches } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: null } }],
    [{ filename: "W#02.png", bytes: Buffer.from("x"), mime: "image/png" }],
  );
  assert.equal(matches.size, 1);
});

test("duplicate photos for same welder flagged", () => {
  const { results } = matchPhotosToWelders(
    [{ welder: { plantWelderId: "W#02", photoFilename: null } }],
    [
      { filename: "W#02.jpg", bytes: Buffer.from("a"), mime: "image/jpeg" },
      { filename: "W#02.png", bytes: Buffer.from("b"), mime: "image/png" },
    ],
  );
  assert.equal(results[0].status, "duplicate");
});

console.log("\nAll bulk import validation tests passed.");
