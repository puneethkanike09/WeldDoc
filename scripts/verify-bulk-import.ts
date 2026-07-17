import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { IMPORT_SHEET_NAME } from "../src/lib/welders/bulk-import/columns";
import {
  buildImportTemplateBuffer,
  TEMPLATE_EXAMPLE_ROW_COUNT,
  verifyBuiltImportTemplate,
} from "../src/lib/welders/bulk-import/template";
import { matchPhotosToWelders } from "../src/lib/welders/bulk-import/match-import-photos";
import { planImportDocuments } from "../src/lib/welders/bulk-import/match-import-docs";
import { resolveDocAttachmentForPlant } from "../src/lib/welders/bulk-import/resolve-doc-attachments";
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
    welder_id: "W#9001",
    full_name: "Test Welder",
    ...overrides,
  };
}

/** A minimal BW qualification row (client template columns). */
function bwQualRaw(overrides: Record<string, string> = {}) {
  return {
    process: "135",
    joint_type: "BW",
    bw_position: "PF",
    filler_group: "FM1",
    bw_test_thickness_mm: "12",
    revalidation_method: "9.3b",
    weld_test_revalidation_date: "2025-01-15",
    ...overrides,
  };
}

console.log("Bulk welder import validation (client Option A template)\n");

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

test("template header uses exact client labels", () => {
  const buffer = buildImportTemplateBuffer();
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheet = wb.Sheets[IMPORT_SHEET_NAME];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  const header = rows[0] as string[];
  assert.ok(header.includes("welder_id"));
  assert.ok(header.includes("BW position"));
  assert.ok(header.includes("FW position"));
  assert.ok(header.includes("BW test_thickness_mm"));
  assert.ok(header.includes("FW test_thickness_mm"));
  assert.ok(header.includes("Weld Test/ Re validation Date"));
  assert.ok(header.includes("Validation expiry_date"));
  assert.ok(header.includes("continuity_last_verified"));
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

test("allows blank welder_id (auto-assign in preview)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ welder_id: "" }) }],
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

test("welder + BW qualification validates and computes expiry", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.qualificationCount, 1);
  assert.equal(r.rows[0].qualification?.jointType, "BW");
  assert.equal(r.rows[0].qualification?.position, "PF");
  assert.equal(r.rows[0].qualification?.depositedThicknessMm, 12);
  assert.equal(r.rows[0].qualification?.expiryDate, "2027-01-14");
  assert.equal(r.rows[0].qualification?.wpqStatus, "Approved");
});

test("attaches to existing plant ID in org (no error)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.existingWelderCount, 1);
  assert.equal(r.summary.newWelderCount, 0);
});

test("matches existing plant ID regardless of format (9001 == W#9001)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: baseWelderRaw({ welder_id: "9001" }) }],
    new Set(["W#9001"]),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.summary.existingWelderCount, 1);
});

test("multiple qualification rows for the same W# = one welder", () => {
  const r = validateImportRows(
    [
      { excelRow: 2, raw: { ...baseWelderRaw({ welder_id: "W#50" }), ...bwQualRaw() } },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw({ welder_id: "W#50" }),
          ...bwQualRaw({ process: "141", bw_position: "PA" }),
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
      { excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } },
      {
        excelRow: 3,
        raw: {
          ...baseWelderRaw({ full_name: "Different Name" }),
          ...bwQualRaw({ process: "141" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.message.includes("conflict")));
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
        raw: { ...baseWelderRaw(), ...bwQualRaw({ process: "999" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
});

test("expiry before test date fails", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({
            weld_test_revalidation_date: "2024-06-01",
            validation_expiry_date: "2020-01-01",
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
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ process: "MAG (135)" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "135");
  assert.equal(r.rows[0].raw.process, "135");
});

test("accepts AWS abbreviation for process (SMAW -> 111)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ process: "SMAW" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.process, "111");
});

test("accepts lowercase joint_type (bw -> BW)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ joint_type: "bw" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.jointType, "BW");
});

test("normalizes revalidation method (6.3b/9.3B/b -> 9.3b)", () => {
  for (const input of ["6.3b", "9.3B", "b", "3B"]) {
    const r = validateImportRows(
      [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ revalidation_method: input }) } }],
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
    ["02-Aug-25", "2025-08-02"],
    ["02-Aug-2025", "2025-08-02"],
    ["12-Mar-24", "2024-03-12"],
  ];
  for (const [input, expected] of cases) {
    const r = validateImportRows(
      [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ weld_test_revalidation_date: input }) } }],
      new Set(),
    );
    assert.equal(r.ok, true, `${input}: ${JSON.stringify(r.errors)}`);
    assert.equal(r.rows[0].qualification?.dateOfWelding, expected);
  }
});

test("accepts DD-Mon-YY on date_of_birth and expiry", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw({ date_of_birth: "20-May-88" }),
          ...bwQualRaw({
            weld_test_revalidation_date: "12-Mar-24",
            validation_expiry_date: "12-Mar-28",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].welder.dateOfBirth, "1988-05-20");
  assert.equal(r.rows[0].qualification?.dateOfWelding, "2024-03-12");
  assert.equal(r.rows[0].qualification?.expiryDate, "2028-03-12");
});

test("accepts DD-Mon-YY list in continuity_last_verified", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({
            continuity_last_verified: "02-Aug-25;01-Aug-25;29-Jan-26;20-Jul-26",
          }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(r.rows[0].qualification?.continuityHistory, [
    "2025-08-01",
    "2025-08-02",
    "2026-01-29",
    "2026-07-20",
  ]);
  assert.equal(r.rows[0].qualification?.continuityLastVerified, "2026-07-20");
});

test("strips units from numeric cells (12 mm -> 12)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ bw_test_thickness_mm: "12 mm" }) } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.depositedThicknessMm, 12);
});

test("NA in fw_position/fw_test_thickness_mm is treated as unused on a BW-only row", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({ fw_position: "NA", fw_test_thickness_mm: "NA" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.supplementaryFillet, false);
});

test("preserves raw values for invalid cells (data does not disappear)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw({ bw_position: "ZZ" }) } }],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.equal(r.rows[0].raw.process, "135");
  assert.equal(r.rows[0].raw.bw_position, "ZZ");
  assert.equal(r.rows[0].raw.weld_test_revalidation_date, "2025-01-15");
});

test("blank cells never inherit from the previous row (including continuity)", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#02",
          full_name: "Sanjay",
          date_of_birth: "1988-05-20",
          id_method: "Aadhar",
          id_number: "123456789012",
          photo_filename: "W#02.jpg",
          process: "135",
          joint_type: "BW",
          bw_position: "PF",
          filler_group: "FM1",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          validation_expiry_date: "2027-08-19",
          continuity_last_verified: "2026-01-15",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          welder_id: "W#02",
          full_name: "Sanjay",
          process: "141",
          joint_type: "BW",
          bw_position: "PA",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  // Row 3 blanks stay blank — no copy from row 2
  assert.equal(r.rows[1].welder.dateOfBirth, null);
  assert.equal(r.rows[1].welder.idMethod, null);
  assert.equal(r.rows[1].welder.idNumber, null);
  assert.equal(r.rows[1].welder.photoFilename, null);
  assert.equal(r.rows[1].qualification?.continuityLastVerified, null);
  assert.deepEqual(r.rows[1].qualification?.continuityHistory, []);
  assert.equal(r.rows[1].raw.continuity_last_verified, "");
  assert.equal(r.rows[1].raw.date_of_birth, "");
  assert.equal(r.rows[1].raw.id_number, "");
});

test("blank full_name on a row fails — name is not taken from the row above", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#02",
          full_name: "Sanjay",
          process: "135",
          joint_type: "BW",
          bw_position: "PF",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          welder_id: "",
          full_name: "",
          process: "141",
          joint_type: "BW",
          bw_position: "PA",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.excelRow === 3 && e.column === "full_name"));
});

test("does not fill-forward photo_filename to the next welder row", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#02",
          full_name: "Sanjay Yadav",
          photo_filename: "W#02.jpg",
          process: "135",
          joint_type: "BW",
          bw_position: "PF",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          welder_id: "W#03",
          full_name: "Sanjay Yadav",
          process: "141",
          joint_type: "BW",
          bw_position: "PA",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
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

test("qualification columns are never fill-forwarded between welders", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#02",
          full_name: "Sanjay",
          process: "136",
          joint_type: "BW",
          bw_position: "PF",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2025-08-19",
          revalidation_method: "9.3b",
        },
      },
      {
        excelRow: 3,
        raw: {
          welder_id: "W#03",
          full_name: "Rajesh",
          process: "141",
          joint_type: "FW",
          fw_position: "PA",
          fw_test_thickness_mm: "10",
          weld_test_revalidation_date: "2024-01-10",
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
          welder_id: "W#15",
          full_name: "Rajesh",
          process: "135",
          joint_type: "BW",
          bw_position: "PF",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2019-06-10",
          validation_expiry_date: "2026-03-01",
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
          welder_id: "W#99",
          full_name: "Old Cert",
          process: "135",
          joint_type: "BW",
          bw_position: "PF",
          bw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2019-01-01",
          validation_expiry_date: "2020-01-01",
          revalidation_method: "9.3b",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.wpqStatus, "Expired");
});

test("missing validation_expiry_date emits estimate warning", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.continuityLastVerified, null);
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].column, "validation_expiry_date");
  assert.ok(r.warnings[0].message.includes("Expiry estimated"));
});

console.log("\nOption A joint mapping (BW / FW / BW+FW, dual process)\n");

test("FW-only single process (Rajesh: 141, FW) — no supplementary fillet required", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#15",
          full_name: "Rajesh Kumar",
          process: "141",
          joint_type: "FW",
          fw_position: "PA",
          fw_test_thickness_mm: "12",
          weld_test_revalidation_date: "2019-06-10",
          validation_expiry_date: "2026-03-01",
          revalidation_method: "9.3a",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const q = r.rows[0].qualification!;
  assert.equal(q.jointType, "FW");
  assert.equal(q.jointMode, "FW");
  assert.equal(q.process, "141");
  assert.equal(q.process2, null);
  assert.equal(q.position, "PA");
  assert.equal(q.testThicknessMm, 12);
  assert.equal(q.depositedThicknessMm, null);
  assert.equal(q.supplementaryFillet, false);
});

test("BW-only single process — deposited thickness set, position from bw_position", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const q = r.rows[0].qualification!;
  assert.equal(q.jointType, "BW");
  assert.equal(q.jointMode, "BW");
  assert.equal(q.position, "PF");
  assert.equal(q.depositedThicknessMm, 12);
  assert.equal(q.supplementaryFillet, false);
  assert.equal(q.process2, null);
  assert.equal(q.position2, null);
});

test("BW-only dual process — position_2 and process2 deposited thickness mirror BW columns", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: { ...baseWelderRaw(), ...bwQualRaw({ process: "136+111" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const q = r.rows[0].qualification!;
  assert.equal(q.process, "136");
  assert.equal(q.process2, "111");
  assert.equal(q.position, "PF");
  assert.equal(q.position2, "PF");
  assert.equal(q.depositedThicknessMm, 12);
  assert.equal(q.process2DepositedThicknessMm, 12);
});

test("Sanjay sample — 136+135 dual process, BW/FW joint (client template)", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#14",
          full_name: "Sanjay Yadav",
          date_of_birth: "1988-05-20",
          id_method: "Aadhar",
          id_number: "123456789012",
          photo_filename: "W#14.jpg",
          process: "136+135",
          joint_type: "BW/FW",
          bw_position: "PF",
          fw_position: "PB",
          filler_group: "FM1",
          bw_test_thickness_mm: "12",
          fw_test_thickness_mm: "8",
          revalidation_method: "9.3b",
          weld_test_revalidation_date: "2025-08-19",
          validation_expiry_date: "2027-08-19",
          continuity_last_verified: "2026-01-15",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const q = r.rows[0].qualification!;
  assert.equal(r.rows[0].welder.plantWelderId, "W#14");
  assert.equal(q.process, "136");
  assert.equal(q.process2, "135");
  // Never stored as "BW/FW" — always BW with supplementary fillet coverage.
  assert.equal(q.jointType, "BW");
  assert.equal(q.jointMode, "BW_FW");
  assert.equal(q.position, "PF");
  assert.equal(q.position2, "PF");
  assert.equal(q.depositedThicknessMm, 12);
  assert.equal(q.process2DepositedThicknessMm, 12);
  assert.equal(q.supplementaryFillet, true);
  assert.equal(q.supplementaryFilletPosition, "PB");
  assert.equal(q.supplementaryFilletThicknessMm, 8);
  assert.equal(q.supplementaryFillet2, true);
  assert.equal(q.supplementaryFillet2Position, "PB");
  assert.equal(q.supplementaryFillet2ThicknessMm, 8);
  assert.equal(q.expiryDate, "2027-08-19");
  assert.equal(q.continuityLastVerified, "2026-01-15");
});

test("Rajesh sample — 141 single process, FW only, multi-date continuity in one cell", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          welder_id: "W#15",
          full_name: "Rajesh Kumar",
          process: "141",
          joint_type: "FW",
          bw_position: "NA",
          fw_position: "PA",
          filler_group: "FM1",
          bw_test_thickness_mm: "NA",
          fw_test_thickness_mm: "12",
          revalidation_method: "9.3a",
          weld_test_revalidation_date: "2019-06-10",
          validation_expiry_date: "2026-03-01",
          continuity_last_verified:
            "2019-12-01;2020-06-01;2021-06-01;2023-06-01;2025-12-01",
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const q = r.rows[0].qualification!;
  assert.equal(q.process, "141");
  assert.equal(q.process2, null);
  assert.equal(q.jointType, "FW");
  assert.equal(q.jointMode, "FW");
  assert.equal(q.position, "PA");
  assert.equal(q.testThicknessMm, 12);
  assert.equal(q.supplementaryFillet, false);
  assert.deepEqual(q.continuityHistory, [
    "2019-12-01",
    "2020-06-01",
    "2021-06-01",
    "2023-06-01",
    "2025-12-01",
  ]);
  assert.equal(q.continuityLastVerified, "2025-12-01");
  const records = collectValidationRecordsForImport(q);
  assert.equal(records.filter((rec) => rec.kind === "continuity").length, 5);
});

test("missing bw_position on BW joint fails with a specific error", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: { ...baseWelderRaw(), ...bwQualRaw({ bw_position: "" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "bw_position"));
});

test("missing fw_position/fw_test_thickness_mm on BW/FW joint fails", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: { ...baseWelderRaw(), ...bwQualRaw({ joint_type: "BW/FW" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "fw_position"));
  assert.ok(r.errors.some((e) => e.column === "fw_test_thickness_mm"));
});

test("rejects unknown process combo code", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: { ...baseWelderRaw(), ...bwQualRaw({ process: "136+999" }) },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.column === "process"));
});

console.log("\nValidation history (continuity_last_verified)\n");

test("parses continuity_last_verified semicolon-separated dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({
            continuity_last_verified:
              "2020-01-15;2020-07-15;2021-01-15;2025-12-01",
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
  assert.equal(r.rows[0].qualification?.continuityLastVerified, "2025-12-01");
});

test("parses comma-separated history dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({
            continuity_last_verified: "2020-01-15, 2020-07-15",
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
  assert.equal(r.rows[0].qualification?.continuityLastVerified, "2020-07-15");
});

test("blank continuity_last_verified stays blank (no history invented)", () => {
  const r = validateImportRows(
    [{ excelRow: 2, raw: { ...baseWelderRaw(), ...bwQualRaw() } }],
    new Set(),
  );
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.rows[0].qualification?.continuityLastVerified, null);
  assert.deepEqual(r.rows[0].qualification?.continuityHistory, []);
});

test("rejects invalid date in continuity_last_verified", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({ continuity_last_verified: "2020-01-15;not-a-date" }),
        },
      },
    ],
    new Set(),
  );
  assert.equal(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.column === "continuity_last_verified"),
  );
});

test("dedupes continuity_last_verified dates", () => {
  const r = validateImportRows(
    [
      {
        excelRow: 2,
        raw: {
          ...baseWelderRaw(),
          ...bwQualRaw({
            continuity_last_verified: "2020-01-15;2020-01-15;2021-01-15",
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

test("collectValidationRecordsForImport uses only last verified when no extra history", () => {
  const records = collectValidationRecordsForImport({
    continuityLastVerified: "2025-12-01",
    continuityHistory: ["2025-12-01"],
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
    "continuity_last_verified",
    2,
    errors,
  );
  assert.equal(errors.length, 0);
  assert.deepEqual(dates, ["2020-01-15", "2021-01-15"]);
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

test("photo match by welder_id fallback W#02.png", () => {
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

console.log("\nZIP document matching (Phase 2)\n");

test("planImportDocuments matches cert + dated + numbered continuity", () => {
  const plan = planImportDocuments(
    ["W#14", "W#14"],
    [
      {
        filename: "W#14.pdf",
        bytes: Buffer.from("%PDF"),
        mime: "application/pdf",
      },
    ],
    [
      {
        filename: "W#14_2025-08-02.pdf",
        bytes: Buffer.from("%PDF"),
        mime: "application/pdf",
      },
      {
        filename: "W#14_cont_1.pdf",
        bytes: Buffer.from("%PDF"),
        mime: "application/pdf",
      },
    ],
  );
  assert.equal(plan.certificateByPlant.has("W#14"), true);
  assert.equal(plan.continuityByDate.has("W#14|2025-08-02"), true);
  assert.equal(plan.legacyByPlant.get("W#14")?.length, 1);
});

test("resolveDocAttachment date-match and orphan → legacy", () => {
  const att = resolveDocAttachmentForPlant(
    "W#14",
    {
      certificates: { "W#14": "c/cert.pdf" },
      continuityByDate: {
        "W#14|2025-08-02": "c/dated.pdf",
        "W#14|2020-01-01": "c/orphan.pdf",
      },
      legacyByPlant: { "W#14": ["c/leg.pdf"] },
    },
    ["2025-08-02"],
  );
  assert.equal(att.signedCertificatePath, "c/cert.pdf");
  assert.equal(att.supportingByDate["2025-08-02"], "c/dated.pdf");
  assert.deepEqual(att.legacyDocumentPaths, ["c/leg.pdf", "c/orphan.pdf"]);
});

test("continuity cap at 10 with warnings", () => {
  const files = Array.from({ length: 12 }, (_, i) => ({
    filename: `W#02_cont_${i + 1}.pdf`,
    bytes: Buffer.from("%PDF"),
    mime: "application/pdf",
  }));
  const plan = planImportDocuments(["W#02"], [], files);
  assert.equal(plan.legacyByPlant.get("W#02")?.length, 10);
  assert.ok(plan.continuityWarnings.some((w) => w.includes("capped")));
});

console.log("\nAll bulk import validation tests passed.");
