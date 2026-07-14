/**
 * Client-facing Excel: date calculation guide (matching plant continuity
 * schedule) + WeldDoc Import sheet ready to fill.
 */
import * as XLSX from "xlsx";
import { applyImportSheetFormats } from "./xlsx-formats";

/** Add months to an ISO date (UTC), return YYYY-MM-DD. */
function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

/** EDATE(date, months) - 1 day (client continuity rule). */
function validationFrom(iso: string, months = 6): string {
  const after = addMonthsIso(iso, months);
  const [y, m, d] = after.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return dt.toISOString().slice(0, 10);
}

/** Format YYYY-MM-DD as DD-MMM-YY (client display). */
function toClientDate(iso: string): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  const yy = String(y).slice(-2);
  return `${String(d).padStart(2, "0")}-${months[m - 1]}-${yy}`;
}

export type ClientDateSchedule = {
  testDate: string;
  validation1: string;
  validation2: string;
  validation3: string;
  revalidation: string;
  validation4: string;
  validation5: string;
  validation6: string;
  expiry: string;
};

/** Same rules as the client's plant Excel (EDATE +6 −1, reval +24, expiry +24 from reval). */
export function computeClientDateSchedule(testDateIso: string): ClientDateSchedule {
  const validation1 = validationFrom(testDateIso, 6);
  const validation2 = validationFrom(validation1, 6);
  const validation3 = validationFrom(validation2, 6);
  const revalidation = addMonthsIso(testDateIso, 24);
  const validation4 = validationFrom(revalidation, 6);
  const validation5 = validationFrom(validation4, 6);
  const validation6 = validationFrom(validation5, 6);
  const expiry = addMonthsIso(revalidation, 24);
  return {
    testDate: testDateIso,
    validation1,
    validation2,
    validation3,
    revalidation,
    validation4,
    validation5,
    validation6,
    expiry,
  };
}

export function continuityHistoryFromSchedule(s: ClientDateSchedule): string {
  return [
    s.validation1,
    s.validation2,
    s.validation3,
    s.validation4,
    s.validation5,
    s.validation6,
  ].join(";");
}

/** Build downloadable client guide workbook. */
export function buildClientDateGuideBuffer(): Buffer {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Date guide (client-familiar layout) ---
  const exampleTests = [
    "2024-03-12",
    "2024-03-13",
    "2024-03-14",
    "2024-03-15",
    "2024-03-16",
  ];

  const guideAoa: (string | number)[][] = [
    [
      "Formula (same as plant sheet)",
      "EDATE(Test,6)-1",
      "EDATE(prev,6)-1",
      "EDATE(prev,6)-1",
      "EDATE(Test,24)",
      "EDATE(Reval,6)-1",
      "EDATE(prev,6)-1",
      "EDATE(prev,6)-1",
      "EDATE(Reval,24)",
    ],
    [
      "Test Date",
      "1st validation",
      "2nd validation",
      "3rd validation",
      "Revalidation",
      "4th validation",
      "5th validation",
      "6th validation",
      "Expiry",
    ],
    ["Date", "Date", "Date", "Date", "Date", "Date", "Date", "Date", "Date"],
  ];

  for (const test of exampleTests) {
    const s = computeClientDateSchedule(test);
    guideAoa.push([
      toClientDate(s.testDate),
      toClientDate(s.validation1),
      toClientDate(s.validation2),
      toClientDate(s.validation3),
      toClientDate(s.revalidation),
      toClientDate(s.validation4),
      toClientDate(s.validation5),
      toClientDate(s.validation6),
      toClientDate(s.expiry),
    ]);
  }

  guideAoa.push([]);
  guideAoa.push([
    "How this maps to WeldDoc Import sheet (use YYYY-MM-DD there):",
  ]);
  guideAoa.push([
    "Test Date → date_of_welding",
  ]);
  guideAoa.push([
    "1st–6th validation → continuity_history (join with ; ) and continuity_last_verified = latest done date",
  ]);
  guideAoa.push([
    "Revalidation → revalidation_history",
  ]);
  guideAoa.push([
    "Expiry → expiry_date (store as-is, do not recalculate)",
  ]);
  guideAoa.push([
    "For 2-year certificates use revalidation_method = 9.3b",
  ]);
  guideAoa.push([]);
  guideAoa.push([
    "Only enter validation / revalidation dates that actually happened. Leave future dates out of continuity_history.",
  ]);

  const guideSheet = XLSX.utils.aoa_to_sheet(guideAoa);
  guideSheet["!cols"] = Array.from({ length: 9 }, () => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, guideSheet, "Date_guide");

  // --- Sheet 2: How to fill ---
  const howAoa: string[][] = [
    ["Step", "What to do"],
    [
      "1",
      "Download this file. Keep Date_guide for your plant date rules (6-month continuity, 2-year revalidation).",
    ],
    [
      "2",
      "Open the Import sheet. Fill one row per certificate (qualification).",
    ],
    [
      "3",
      "Enter welder name and W# No (or leave W# blank to auto-assign). Add process, position, thickness, etc.",
    ],
    [
      "4",
      "date_of_welding = Test Date from your records (format YYYY-MM-DD, e.g. 2024-03-12).",
    ],
    [
      "5",
      "expiry_date = Expiry from your certificate / Date_guide (YYYY-MM-DD). WeldDoc stores it exactly — no recalculation.",
    ],
    [
      "6",
      "continuity_last_verified = last continuity sign-off that was done (latest past validation date).",
    ],
    [
      "7",
      "continuity_history = all past continuity dates separated by semicolon, e.g. 2024-09-11;2025-03-10;2025-09-09",
    ],
    [
      "8",
      "revalidation_history = past revalidation date(s), e.g. 2026-03-12 (omit if not yet done).",
    ],
    [
      "9",
      "revalidation_method = 9.3b for this 2-year schedule (or 9.3a / 9.3c if your certificate says otherwise).",
    ],
    [
      "10",
      "Optional photos: name files W#02.jpg (same as plant ID) or set photo_filename column. Upload with the spreadsheet in WeldDoc.",
    ],
    [
      "11",
      "In WeldDoc: Import welders → choose this Import sheet file → Check my spreadsheet → Import these welders.",
    ],
  ];
  const howSheet = XLSX.utils.aoa_to_sheet(howAoa);
  howSheet["!cols"] = [{ wch: 6 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(wb, howSheet, "How_to_import");

  // --- Sheet 3: Import (WeldDoc headers) ---
  const s0 = computeClientDateSchedule("2024-03-12");
  // Example: as of mid-2026, validations 1–3 done, revalidation done, 4th may be pending — show full history for demo
  const header = [
    "plant_welder_id",
    "full_name",
    "date_of_birth",
    "id_method",
    "id_number",
    "photo_filename",
    "process",
    "joint_type",
    "position",
    "base_material_group",
    "filler_group",
    "test_thickness_mm",
    "product",
    "date_of_welding",
    "expiry_date",
    "continuity_last_verified",
    "continuity_history",
    "revalidation_history",
    "revalidation_method",
  ];

  const exampleRow = [
    "W#15",
    "Example Welder",
    "1985-04-12",
    "Aadhar",
    123456789012,
    "W#15.jpg",
    "135",
    "BW",
    "PF",
    "1",
    "FM1",
    12,
    "Plate",
    s0.testDate,
    s0.expiry,
    s0.validation3, // last continuity before revalidation in early cycle — for full schedule use latest past
    continuityHistoryFromSchedule(s0),
    s0.revalidation,
    "9.3b",
  ];

  // Better continuity_last_verified for "today ~ Jul 2026": after reval Mar 2026, 4th is Sep 2026 — so last verified could be reval period; use validation3 or if we're past reval use a continuity after. For Jul 2026, validation4 is Sep 2026 (future), so last = could be day of revalidation continuity or validation3. Use revalidation date as last for snapshot if they signed then — actually continuity is separate from revalidation. Use validation3 as last done before Jul 2026... Wait validation4 is 11-Sep-26 which is future from Jul 13 2026. So last continuity done = validation3 (09-Sep-25) unless they did something at reval. Keep validation3.

  const importAoa = [header, exampleRow];
  // Blank rows for client to fill
  for (let i = 0; i < 8; i++) {
    importAoa.push(header.map(() => ""));
  }

  const importSheet = XLSX.utils.aoa_to_sheet(importAoa);
  applyImportSheetFormats(importSheet, header, importAoa.length - 1);
  importSheet["!cols"] = header.map((h) => ({
    wch: Math.min(28, Math.max(12, h.length + 2)),
  }));
  XLSX.utils.book_append_sheet(wb, importSheet, "Import");

  return Buffer.from(
    XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer,
  );
}
