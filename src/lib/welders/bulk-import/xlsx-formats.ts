import * as XLSX from "xlsx";

/** Apply Excel number format to id_number column (no scientific notation in template). */
export function applyImportSheetFormats(
  sheet: XLSX.WorkSheet,
  header: readonly string[],
  dataRowCount: number,
): void {
  const idIdx = header.indexOf("id_number");
  if (idIdx < 0) return;

  for (let r = 1; r <= dataRowCount; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: idIdx });
    const cell = sheet[addr];
    if (!cell || cell.v == null || cell.v === "") continue;

    if (typeof cell.v === "string" && /^\d+$/.test(cell.v)) {
      cell.v = Number(cell.v);
    }
    if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
      cell.t = "n";
      cell.z = "0";
    }
  }
}
