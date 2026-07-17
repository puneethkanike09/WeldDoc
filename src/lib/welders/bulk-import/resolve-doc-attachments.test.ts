import { describe, expect, it } from "vitest";
import type { ImportDocPaths } from "./match-import-docs";
import { resolveDocAttachmentForPlant } from "./resolve-doc-attachments";

const paths: ImportDocPaths = {
  certificates: { "W#14": "org/certs/W14.pdf" },
  continuityByDate: {
    "W#14|2025-08-02": "org/cont/dated.pdf",
    "W#14|2024-01-01": "org/cont/orphan.pdf",
  },
  legacyByPlant: { "W#14": ["org/cont/a.pdf", "org/cont/b.pdf"] },
};

describe("resolveDocAttachmentForPlant", () => {
  it("attaches cert, legacy, and date-matched supporting docs", () => {
    const att = resolveDocAttachmentForPlant("W#14", paths, [
      "2025-08-02",
      "2025-09-01",
    ]);
    expect(att.signedCertificatePath).toBe("org/certs/W14.pdf");
    expect(att.legacyDocumentPaths).toEqual([
      "org/cont/a.pdf",
      "org/cont/b.pdf",
      "org/cont/orphan.pdf",
    ]);
    expect(att.supportingByDate).toEqual({
      "2025-08-02": "org/cont/dated.pdf",
    });
  });

  it("returns empty attachments when no docs", () => {
    const att = resolveDocAttachmentForPlant("W#14", undefined, ["2025-08-02"]);
    expect(att.signedCertificatePath).toBeNull();
    expect(att.legacyDocumentPaths).toEqual([]);
    expect(att.supportingByDate).toEqual({});
  });

  it("works for dual-process same W# (same plant attachments)", () => {
    const a = resolveDocAttachmentForPlant("W#14", paths, ["2025-08-02"]);
    const b = resolveDocAttachmentForPlant("W14", paths, ["2025-08-02"]);
    expect(a.signedCertificatePath).toBe(b.signedCertificatePath);
    expect(a.supportingByDate).toEqual(b.supportingByDate);
  });
});
