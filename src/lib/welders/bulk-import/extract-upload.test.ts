import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { extractImportUpload } from "./extract-upload";

async function zipForm(entries: Record<string, string | Uint8Array>): Promise<FormData> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) {
    zip.file(path, content);
  }
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const file = new File([bytes], "olddata.zip", { type: "application/zip" });
  const fd = new FormData();
  fd.append("zip", file);
  return fd;
}

describe("extractImportUpload ZIP docs", () => {
  it("extracts excel + photos + certificates + continuity folders", async () => {
    const fd = await zipForm({
      "Import.xlsx": "PK-fake-excel",
      "photos/W#14.jpg": new Uint8Array([1, 2, 3]),
      "certificates/W#14.pdf": "%PDF-1.4 cert",
      "continuity/W#14_2025-08-02.pdf": "%PDF-1.4 cont",
      "continuity/W#14_cont_1.pdf": "%PDF-1.4 legacy",
    });
    const result = await extractImportUpload(fd);
    expect(result.fileError).toBeUndefined();
    expect(result.excel?.name).toBe("Import.xlsx");
    expect(result.photos.map((p) => p.filename)).toEqual(["W#14.jpg"]);
    expect(result.certificates.map((c) => c.filename)).toEqual(["W#14.pdf"]);
    expect(result.continuity.map((c) => c.filename).sort()).toEqual([
      "W#14_2025-08-02.pdf",
      "W#14_cont_1.pdf",
    ]);
  });

  it("ignores PDFs outside certificates/ and continuity/", async () => {
    const fd = await zipForm({
      "Import.xlsx": "PK",
      "random/W#14.pdf": "%PDF",
      "photos/W#14.pdf": "%PDF", // wrong folder + not image
    });
    const result = await extractImportUpload(fd);
    expect(result.certificates).toHaveLength(0);
    expect(result.continuity).toHaveLength(0);
    expect(result.photos).toHaveLength(0);
  });

  it("works when photos/certificates/continuity folders are missing", async () => {
    const fd = await zipForm({ "Import.xlsx": "PK" });
    const result = await extractImportUpload(fd);
    expect(result.fileError).toBeUndefined();
    expect(result.photos).toEqual([]);
    expect(result.certificates).toEqual([]);
    expect(result.continuity).toEqual([]);
  });

  it("excel-only form has empty doc lists", async () => {
    const fd = new FormData();
    fd.append(
      "excel",
      new File(["PK"], "Import.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const result = await extractImportUpload(fd);
    expect(result.excel?.name).toBe("Import.xlsx");
    expect(result.certificates).toEqual([]);
    expect(result.continuity).toEqual([]);
  });

  it("errors when ZIP has no xlsx", async () => {
    const fd = await zipForm({ "certificates/W#14.pdf": "%PDF" });
    const result = await extractImportUpload(fd);
    expect(result.fileError).toMatch(/Excel/i);
  });

  it("accepts nested folder paths like docs/certificates/", async () => {
    const fd = await zipForm({
      "batch/Import.xlsx": "PK",
      "batch/certificates/W#02.pdf": "%PDF",
      "batch/continuity/W#02_cont_1.pdf": "%PDF",
      "batch/photos/W#02.png": new Uint8Array([9]),
    });
    const result = await extractImportUpload(fd);
    expect(result.certificates[0]?.filename).toBe("W#02.pdf");
    expect(result.continuity[0]?.filename).toBe("W#02_cont_1.pdf");
    expect(result.photos[0]?.filename).toBe("W#02.png");
  });
});
